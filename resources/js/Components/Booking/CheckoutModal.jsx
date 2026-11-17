import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
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
    Checkbox,
    Link as MuiLink,
    Grid,
    InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import TimerIcon from '@mui/icons-material/Timer';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import apiClient, { setAuthToken } from '../../api/client';
import GoogleButton from '../Auth/GoogleButton';

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
    presentation = 'dialog',
    initialPickupPointId = '',
    initialReturnPointId = '',
    pickupTime = '09:00',
    returnTime = '09:00',
}) {
    const { auth } = usePage().props;
    const [resolvedUser, setResolvedUser] = useState(currentUser || auth?.user || null);
    const activeUser = resolvedUser || currentUser || auth?.user || null;
    const needsRiderContact = !activeUser || !activeUser.phone;

    const [riderName, setRiderName] = useState(activeUser?.name || '');
    const [riderPhone, setRiderPhone] = useState(activeUser?.phone || '');
    const [riderEmail, setRiderEmail] = useState(activeUser?.email || '');
    const [otpChallenge, setOtpChallenge] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);

    useEffect(() => {
        if (resendCountdown <= 0) return;
        const interval = setInterval(() => {
            setResendCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [resendCountdown]);

    const handleResendOtp = async () => {
        if (resendCountdown > 0 || isSubmitting) return;
        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const finalName = (riderName || activeUser?.name || '').trim();
            const cleanPhone = (riderPhone || '').replace(/\D/g, '');
            const res = await apiClient.post('/auth/checkout-resolve', {
                name: finalName,
                phone: cleanPhone,
                email: (riderEmail || activeUser?.email || '').trim() || undefined,
                verify_phone: true,
            });
            if (res.status === 'otp_required') {
                setOtpChallenge(res);
                setResendCountdown(30);
                setStatusMessage('New verification code sent successfully.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to resend verification code.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const [billingType, setBillingType] = useState('personal');
    const [billingName, setBillingName] = useState(activeUser?.name || '');
    const [billingAddress, setBillingAddress] = useState('');
    const [billingStateCode, setBillingStateCode] = useState('29');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [billingGstin, setBillingGstin] = useState('');


    const [gateway, setGateway] = useState('phonepe');
    const [paymentOption, setPaymentOption] = useState('advance');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [heldBooking, setHeldBooking] = useState(null);
    const [pickupPointId, setPickupPointId] = useState(initialPickupPointId ? String(initialPickupPointId) : '');
    const [returnPointId, setReturnPointId] = useState(initialReturnPointId ? String(initialReturnPointId) : '');
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

    useEffect(() => {
        if (pickupPoints.length > 0) {
            if (initialPickupPointId && pickupPoints.some((p) => String(p.id) === String(initialPickupPointId))) {
                setPickupPointId(String(initialPickupPointId));
            } else if (!pickupPointId && pickupPoints[0]) {
                setPickupPointId(String(pickupPoints[0].id));
            }
        }
    }, [pickupPoints, initialPickupPointId]);

    useEffect(() => {
        if (returnPoints.length > 0) {
            if (initialReturnPointId && returnPoints.some((p) => String(p.id) === String(initialReturnPointId))) {
                setReturnPointId(String(initialReturnPointId));
            } else if (!returnPointId && returnPoints[0]) {
                setReturnPointId(String(returnPoints[0].id));
            }
        }
    }, [returnPoints, initialReturnPointId]);
    const pickupPoint = pickupPoints.find((p) => String(p.id) === pickupPointId);
    const returnPoint = returnPoints.find((p) => String(p.id) === returnPointId);
    const hasPointOptions = pickupPoints.length > 0 && returnPoints.length > 0;
    const pointFeesConfigured = pickupPoint?.pickup_fee != null && returnPoint?.return_fee != null;
    const pointSelectionValid = hasPointOptions && pointFeesConfigured && Boolean(pickupPoint && returnPoint)
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
            setErrorMessage('Choose pickup and return points with configured charges. Hotel/custom requests also need an address.');
            return;
        }
        if (heldBooking && !acceptedTerms) {
            setErrorMessage('Please review and accept the rental terms before payment.');
            return;
        }
        if (billingName.trim().length < 2) {
            setErrorMessage('Please enter a billing name (at least 2 characters).');
            return;
        }
        if (billingAddress.trim().length < 3) {
            setErrorMessage('Please enter a billing address or town (at least 3 characters, e.g. Kumta).');
            return;
        }
        if (!/^\d{2}$/.test(billingStateCode.trim())) {
            setErrorMessage('Please enter a valid 2-digit GST state code (e.g. 29 for Karnataka).');
            return;
        }
        if (billingType === 'business' && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(billingGstin.trim().toUpperCase())) {
            setErrorMessage('Enter a valid-format GSTIN for the business invoice.');
            return;
        }
        setIsSubmitting(true);
        setErrorMessage('');

        // Step 1: Resolve guest auto-account or missing phone number (e.g. Google login user)
        if (needsRiderContact && !heldBooking) {
            const finalName = (riderName || activeUser?.name || '').trim();
            const cleanPhone = (riderPhone || '').replace(/\D/g, '');
            if (!finalName) {
                setErrorMessage('Please enter the lead rider full name.');
                setIsSubmitting(false);
                return;
            }
            if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
                setErrorMessage('Please enter a valid 10-digit WhatsApp mobile number (e.g. 9845123456).');
                setIsSubmitting(false);
                return;
            }

            setStatusMessage('Preparing your customer account...');
            try {
                const resolveRes = await apiClient.post('/auth/checkout-resolve', {
                    name: finalName,
                    phone: cleanPhone,
                    email: (riderEmail || activeUser?.email || '').trim() || undefined,
                    verify_phone: true,
                });

                if (resolveRes.status === 'otp_required') {
                    setOtpChallenge(resolveRes);
                    setResendCountdown(30);
                    setStatusMessage('');
                    setIsSubmitting(false);
                    return;
                }

                if (resolveRes.status === 'authenticated') {
                    if (resolveRes.data?.token) setAuthToken(resolveRes.data.token);
                    if (resolveRes.data?.user) setResolvedUser(resolveRes.data.user);
                }
            } catch (err) {
                setErrorMessage(err.message || 'Could not set up customer account. Please try again.');
                setIsSubmitting(false);
                return;
            }
        }

        await proceedWithHoldAndPay();
    };

    const handleVerifyOtpAndPay = async () => {
        if (!otpChallenge?.user_id || otpCode.trim().length !== 6) return;
        setIsSubmitting(true);
        setErrorMessage('');
        setStatusMessage('Verifying code...');

        try {
            const verifyRes = await apiClient.post('/auth/checkout-verify-otp', {
                user_id: otpChallenge.user_id,
                otp: otpCode.trim(),
            });
            if (verifyRes.status === 'authenticated') {
                if (verifyRes.data?.token) setAuthToken(verifyRes.data.token);
                if (verifyRes.data?.user) setResolvedUser(verifyRes.data.user);
                setOtpChallenge(null);
                setOtpCode('');
                await proceedWithHoldAndPay();
            }
        } catch (err) {
            setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
            setIsSubmitting(false);
        }
    };

    const proceedWithHoldAndPay = async () => {
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
                    pickup_time: pickupTime || undefined,
                    return_time: returnTime || undefined,
                    pickup_store_id: Number(pickupStore.id),
                    return_store_id: Number(returnStore.id),
                    pickup_point_id: Number(pickupPointId),
                    return_point_id: Number(returnPointId),
                    pickup_location_details: pickupPoint?.slug === 'hotel-delivery' ? pickupDetails.trim() : null,
                    return_location_details: returnPoint?.slug === 'hotel-delivery' ? returnDetails.trim() : null,
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
                setAcceptedTerms(false);

                // Require review for individual bikes AND model bookings.
                // Pickup fees, final allocation and tax may change the initial estimate.
                setStatusMessage('Bike reserved. Review the confirmed total, GST and billing details before payment.');
                setIsSubmitting(false);
                return;
            }
            setStatusMessage(`Reservation ${booking.booking_reference}. Creating ${gateway === 'phonepe' ? 'PhonePe' : 'Razorpay'} payment order...`);

            // 3. Initiate payment order creation on server
            if (booking.held_until && Date.parse(booking.held_until) <= Date.now()) {
                throw new Error('Your reservation hold has expired. Close this dialog and start a new booking.');
            }
            const checkoutRes = await apiClient.post(`/bookings/${booking.id}/checkout`, {
                gateway: gateway,
                payment_option: paymentOption,
                accept_rental_terms: acceptedTerms,
                billing: {
                    type: billingType,
                    name: billingName.trim(),
                    address: billingAddress.trim(),
                    state_code: billingStateCode.trim(),
                    ...(billingType === 'business' ? { gstin: billingGstin.trim().toUpperCase() } : {}),
                },
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

    const isPage = presentation === 'page';
    const Shell = isPage ? Box : Dialog;

    return (
        <>
            <Shell
            {...(isPage
                ? {
                    sx: {
                        width: '100%',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: { xs: 2, md: 3 },
                        overflow: 'hidden',
                        boxShadow: '0 14px 35px rgba(15, 23, 42, 0.06)',
                    },
                }
                : {
                    open,
                    onClose: isSubmitting ? undefined : onClose,
                    maxWidth: 'md',
                    fullWidth: true,
                    PaperProps: {
                        sx: {
                            borderRadius: { xs: 0, sm: 3 },
                            m: { xs: 0, sm: 2 },
                            width: { xs: '100%', sm: 'calc(100% - 32px)' },
                            maxHeight: { xs: '100dvh', sm: '90vh' },
                        },
                    },
                })}
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
                {!isPage && !isSubmitting && (
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>

            <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                    <Chip size="small" label="1. Rider & Location" color={!heldBooking ? 'primary' : 'default'}
                        variant={!heldBooking ? 'filled' : 'outlined'} sx={{ fontWeight: 750 }} />
                    <Chip size="small" label="2. Pricing & GST" color={heldBooking ? 'primary' : 'default'}
                        variant={heldBooking ? 'filled' : 'outlined'} sx={{ fontWeight: 750 }} />
                    <Chip size="small" label="3. Secure Payment" color={heldBooking ? 'primary' : 'default'} variant="outlined" sx={{ fontWeight: 750 }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {heldBooking
                        ? 'Bike held. Review the final total and payment details before paying.'
                        : 'Add rider, pickup and billing details to receive a confirmed rental quote.'}
                </Typography>
            </Box>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
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

                {activeUser && activeUser.phone && !heldBooking && (
                    <Card
                        variant="outlined"
                        sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 3,
                            borderColor: '#99F6E4',
                            bgcolor: '#F0FDFA',
                            boxShadow: '0 2px 10px rgba(13, 148, 136, 0.06)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: '#0D9488',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <VerifiedUserIcon fontSize="small" />
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                            {activeUser.name || 'Verified Rider'}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label="Account Verified"
                                            color="success"
                                            variant="filled"
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 750 }}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 600 }}>
                                        +91 {activeUser.phone} {activeUser.email ? `• ${activeUser.email}` : ''}
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                    setResolvedUser(null);
                                    setRiderPhone('');
                                }}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748B' }}
                            >
                                Switch Account
                            </Button>
                        </Box>
                    </Card>
                )}

                {needsRiderContact && !heldBooking && (
                    <Card
                        variant="outlined"
                        sx={{
                            mb: 3,
                            borderRadius: 3,
                            borderColor: '#0D9488',
                            borderWidth: 1.5,
                            boxShadow: '0 4px 20px -2px rgba(13, 148, 136, 0.08)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Section Header Banner */}
                        <Box
                            sx={{
                                px: 2.5,
                                py: 1.5,
                                bgcolor: 'rgba(13, 148, 136, 0.06)',
                                borderBottom: '1px solid rgba(13, 148, 136, 0.15)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: '#0D9488',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    1
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                                        Rider &amp; Booking Account
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 600 }}>
                                        Instant booking setup • No password needed
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                size="small"
                                icon={<WhatsAppIcon sx={{ fontSize: '16px !important', color: '#16A34A !important' }} />}
                                label="Instant WhatsApp Voucher"
                                sx={{
                                    bgcolor: '#DCFCE7',
                                    color: '#15803D',
                                    fontWeight: 750,
                                    fontSize: '0.75rem',
                                    border: '1px solid #BBF7D0',
                                }}
                            />
                        </Box>

                        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                            {/* Trust & Policy Assurance Pills */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                                <Chip
                                    size="small"
                                    label="⚡ Fast OTP Verification"
                                    sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 650, fontSize: '0.75rem' }}
                                />
                                <Chip
                                    size="small"
                                    label="🛡️ Zero Security Deposit"
                                    sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: 650, fontSize: '0.75rem' }}
                                />
                                <Chip
                                    size="small"
                                    label="📄 Paperless Digital KYC"
                                    sx={{ bgcolor: '#F8FAFC', color: '#475569', fontWeight: 650, fontSize: '0.75rem' }}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                {/* Full Name */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        required
                                        size="small"
                                        label="Full Name (Lead Rider)"
                                        placeholder="e.g. Rahul Sharma"
                                        value={riderName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setRiderName(val);
                                            if (!billingName || billingName === riderName) {
                                                setBillingName(val);
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutlinedIcon fontSize="small" sx={{ color: '#64748B' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="As printed on Government ID / Driving License"
                                        FormHelperTextProps={{ sx: { fontSize: '0.72rem' } }}
                                    />
                                </Grid>

                                {/* WhatsApp Mobile */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        required
                                        size="small"
                                        label="WhatsApp Mobile Number"
                                        placeholder="98765 43210"
                                        value={riderPhone}
                                        onChange={(e) => setRiderPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        inputProps={{ maxLength: 10, inputMode: 'tel' }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                                            🇮🇳 +91
                                                        </Typography>
                                                    </Box>
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="Voucher, PIN & pickup location sent here"
                                        FormHelperTextProps={{ sx: { fontSize: '0.72rem' } }}
                                    />
                                </Grid>

                                {/* Email Address */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="email"
                                        label="Email Address (Optional)"
                                        placeholder="rahul.sharma@example.com"
                                        value={riderEmail}
                                        onChange={(e) => setRiderEmail(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlinedIcon fontSize="small" sx={{ color: '#64748B' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="For GST tax invoice receipt & backup reservation copy"
                                        FormHelperTextProps={{ sx: { fontSize: '0.72rem' } }}
                                    />
                                </Grid>
                            </Grid>

                            {/* 1-Tap Google Login Alternative */}
                            {!activeUser && (
                                <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #E2E8F0' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                                            Already have a Google account?
                                        </Typography>
                                        <GoogleButton
                                            size="small"
                                            fullWidth={false}
                                            label="1-Tap Google Sign-In"
                                            redirect={typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/services/bikes'}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Card>
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
                            {pickupPoints.map((point) => <MenuItem key={point.id} value={String(point.id)}>{point.name} {point.pickup_fee == null ? '(charge pending)' : `(+₹${Number(point.pickup_fee).toFixed(2)})`}</MenuItem>)}
                        </TextField>
                        {pickupPoint?.slug === 'hotel-delivery' && <TextField
                            fullWidth required label="Hotel name / exact pickup address" value={pickupDetails}
                            disabled={Boolean(heldBooking)} onChange={(event) => setPickupDetails(event.target.value)}
                            inputProps={{ maxLength: 255 }} />}
                        <TextField fullWidth select label={`Return point — ${returnStore?.city || returnStore?.name}`}
                            value={returnPointId} disabled={Boolean(heldBooking) || !hasPointOptions}
                            onChange={(event) => { setReturnPointId(event.target.value); setReturnDetails(''); }}>
                            {returnPoints.map((point) => <MenuItem key={point.id} value={String(point.id)}>{point.name} {point.return_fee == null ? '(charge pending)' : `(+₹${Number(point.return_fee).toFixed(2)})`}</MenuItem>)}
                        </TextField>
                        {returnPoint?.slug === 'hotel-delivery' && <TextField
                            fullWidth required label="Hotel name / exact return address" value={returnDetails}
                            disabled={Boolean(heldBooking)} onChange={(event) => setReturnDetails(event.target.value)}
                            inputProps={{ maxLength: 255 }} />}
                        <Alert severity="info">
                            Each location has its own pickup and return charge. Configured fees are
                            included in the final rental quote before payment. Locations with pending fees
                            cannot be booked online until the branch sets an amount (₹0 only when free).
                        </Alert>
                    </Stack>
                </Card>
                {heldBooking && finalQuote && <Alert severity="info" sx={{ mb: 2 }}>
                    Pickup-point fee: ₹{Number(finalQuote.pickup_fee_amount || 0).toLocaleString('en-IN')} ·
                    Return-point fee: ₹{Number(finalQuote.return_fee_amount || 0).toLocaleString('en-IN')} ·
                    Total location fees: ₹{Number(finalQuote.location_fee_amount || 0).toLocaleString('en-IN')}.
                    These are included in the confirmed booking total alongside any inter-branch fee.
                </Alert>}
                {/* Capture billing details before gateway initiation; server locks these on first checkout. */}
                <Card variant="outlined" sx={{ mb: 3, p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                        Billing details
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        These details will be saved with your booking and locked when payment starts.
                        A GST tax invoice is available only after the supplier's GST settings and invoice issuance are configured.
                    </Typography>
                    <RadioGroup row value={billingType} onChange={(e) => setBillingType(e.target.value)}>
                        <FormControlLabel value="personal" control={<Radio />} label="Personal" />
                        <FormControlLabel value="business" control={<Radio />} label="Business (GSTIN)" />
                    </RadioGroup>
                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                        <TextField size="small" required fullWidth label={billingType === 'business' ? 'Registered business name' : 'Billing name'}
                            value={billingName} onChange={(e) => setBillingName(e.target.value)} inputProps={{ maxLength: 150 }} />
                        <TextField size="small" required fullWidth multiline minRows={2} label="Full billing address"
                            placeholder="e.g. Kumta, Karnataka"
                            helperText="City, street or town name (at least 3 characters)"
                            value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} inputProps={{ maxLength: 500 }} />
                        <TextField size="small" required fullWidth label="GST state code (2 digits)" helperText="For example, Karnataka = 29. Used to verify GSTIN state; does not determine place of supply."
                            value={billingStateCode} onChange={(e) => setBillingStateCode(e.target.value.replace(/\D/g, '').slice(0, 2))} inputProps={{ inputMode: 'numeric', maxLength: 2 }} />
                        {billingType === 'business' && (
                            <TextField size="small" required fullWidth label="Business GSTIN" helperText="Format is checked here; registration validity is not verified."
                                value={billingGstin} onChange={(e) => setBillingGstin(e.target.value.toUpperCase().slice(0, 15))} inputProps={{ maxLength: 15 }} />
                        )}
                    </Stack>
                </Card>

                {!heldBooking && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Continue to hold your bike and confirm the final rental quote. No payment will start until you review it.
                    </Alert>
                )}
                {heldBooking && (
                    <>
                {/* No refundable security deposit is required for new online bike bookings. */}
                <Alert severity="success" sx={{ mb: 2 }}>
                    No refundable deposit for this online reservation. Choose an advance or full rental payment.
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
                        onClick={() => setGateway('phonepe')}
                        sx={{
                            mb: 1.5,
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
                                                PhonePe UPI, QR Intent, Credit/Debit Cards &amp; NetBanking
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                                sx={{ width: '100%', m: 0 }}
                            />
                        </CardContent>
                    </Card>
                </RadioGroup>

                {/* Tax display is entirely server derived; never calculate GST in the browser. */}
                {finalQuote && (
                    <Box sx={{ mt: 3, mb: 1, p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: '#0F172A' }}>
                            Rental price breakdown
                        </Typography>
                        {finalQuote.price_breakdown_json?.bike_gst?.status === 'configured' ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="body2">Taxable rental and fees</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        ₹{Number(finalQuote.price_breakdown_json.bike_gst.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1 }}>
                                    <Typography variant="body2">GST ({finalQuote.price_breakdown_json.bike_gst.gst_rate_percent}%)</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        ₹{Number(finalQuote.price_breakdown_json.bike_gst.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {finalQuote.price_breakdown_json.bike_gst.price_mode === 'inclusive'
                                        ? 'GST is included in the quoted total.'
                                        : 'GST has been added to the quoted rental total.'}
                                </Typography>
                            </>
                        ) : (
                            <Alert severity="warning">
                                GST details are not configured for bike bookings. The displayed quote does not claim a GST tax amount or constitute a tax invoice.
                            </Alert>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1.5, pt: 1, borderTop: '1px solid #E2E8F0' }}>
                            <Typography variant="body1" fontWeight={800}>Final rental total</Typography>
                            <Typography variant="body1" fontWeight={800}>
                                ₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <FormControlLabel
                    sx={{ mt: 2, alignItems: 'flex-start' }}
                    control={
                        <Checkbox
                            checked={acceptedTerms}
                            onChange={(event) => setAcceptedTerms(event.target.checked)}
                            inputProps={{ 'aria-label': 'Agree to bike rental terms' }}
                        />
                    }
                    label={
                        <Typography variant="body2">
                            I have reviewed the rental price, pickup and return conditions, and agree to the{' '}
                            <MuiLink href="/rental-terms" target="_blank" rel="noopener noreferrer">
                                bike rental terms
                            </MuiLink>. I understand the amount due at pickup.
                        </Typography>
                    }
                />

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
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {!heldBooking && !pointFeesConfigured && (
                    <Alert severity="warning" sx={{ width: '100%', fontSize: '0.82rem', fontWeight: 650 }}>
                        The selected pickup or return location has pending fee approval from the branch. Please choose an approved handover point (such as the main hub store) to continue.
                    </Alert>
                )}
                {heldBooking && !acceptedTerms && (
                    <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, textAlign: 'center' }}>
                        Please accept the rental agreement terms to proceed with payment.
                    </Typography>
                )}
                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    disabled={isSubmitting || (!heldBooking && !pointSelectionValid) || (Boolean(heldBooking) && (timeLeftSeconds <= 0 || !acceptedTerms))}
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
                        !heldBooking
                            ? 'Reserve bike & review final price'
                            : `Pay ₹${Number(payNow || 0).toLocaleString('en-IN')} securely`
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
        </Shell>

        {/* Dedicated OTP Verification Popup Modal */}
        <Dialog
            open={Boolean(otpChallenge)}
            onClose={isSubmitting ? undefined : () => {
                setOtpChallenge(null);
                setOtpCode('');
            }}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1,
                    overflowX: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'rgba(13, 148, 136, 0.12)',
                            color: '#0D9488',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <VerifiedUserIcon />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                            Verify Mobile Number
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Quick 1-time verification
                        </Typography>
                    </Box>
                </Box>
                {!isSubmitting && (
                    <IconButton
                        size="small"
                        onClick={() => {
                            setOtpChallenge(null);
                            setOtpCode('');
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </DialogTitle>

            <DialogContent sx={{ overflowX: 'hidden', pt: 1, pb: 2 }}>
                <Typography variant="body2" sx={{ color: '#334155', mb: 2 }}>
                    We sent a 6-digit verification code to{' '}
                    <strong style={{ color: '#0F172A' }}>
                        +91 {otpChallenge?.masked_phone || riderPhone || 'your mobile'}
                    </strong>
                </Typography>

                {otpChallenge?.debug_otp && (
                    <Alert
                        severity="info"
                        icon={<SecurityIcon fontSize="inherit" />}
                        sx={{
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: '#F0FDFA',
                            borderColor: '#99F6E4',
                            border: 1,
                            '& .MuiAlert-message': { width: '100%' },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 600 }}>
                                Test Mode OTP: <strong>{otpChallenge.debug_otp}</strong>
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setOtpCode(String(otpChallenge.debug_otp))}
                                sx={{
                                    py: 0.2,
                                    px: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 750,
                                    borderColor: '#0D9488',
                                    color: '#0D9488',
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                }}
                            >
                                Auto-fill
                            </Button>
                        </Box>
                    </Alert>
                )}

                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                <Box sx={{ my: 2 }}>
                    <TextField
                        fullWidth
                        autoFocus
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && otpCode.length === 6 && !isSubmitting) {
                                e.preventDefault();
                                handleVerifyOtpAndPay();
                            }
                        }}
                        inputProps={{
                            maxLength: 6,
                            inputMode: 'numeric',
                            autoComplete: 'one-time-code',
                            style: {
                                textAlign: 'center',
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                letterSpacing: '0.35em',
                                fontFamily: 'monospace',
                                padding: '12px 14px',
                            },
                        }}
                        helperText="Enter 6-digit OTP received via SMS / WhatsApp"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Button
                        size="small"
                        variant="text"
                        disabled={resendCountdown > 0 || isSubmitting}
                        onClick={handleResendOtp}
                        startIcon={<RestartAltIcon fontSize="small" />}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </Button>

                    <Button
                        size="small"
                        variant="text"
                        disabled={isSubmitting}
                        onClick={() => {
                            setOtpChallenge(null);
                            setOtpCode('');
                        }}
                        sx={{ textTransform: 'none', color: '#64748B', fontSize: '0.8rem' }}
                    >
                        Change mobile number
                    </Button>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isSubmitting || otpCode.trim().length !== 6}
                    onClick={handleVerifyOtpAndPay}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                    sx={{
                        py: 1.25,
                        fontWeight: 800,
                        borderRadius: 2,
                        fontSize: '1rem',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                    }}
                >
                    {isSubmitting ? 'Verifying & Reserving…' : 'Verify & Continue to Reserve'}
                </Button>
            </DialogActions>
        </Dialog>
    </>
);
}

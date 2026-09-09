import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { router, usePage } from '@inertiajs/react';
import AuthModal from '../Auth/AuthModal';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
    IconButton,
    Stack,
    Chip,
    Alert,
    CircularProgress,
    Paper,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { validatePhone, sanitizePhone, formatWhatsAppUrl, SUPPORT_WHATSAPP } from './bookingUtils';

const BOATING_SAFARIS = [
    { id: 'mangrove_backwater', title: 'Sharavathi Mangrove Forest Safari (1 - 1.5 Hrs)', rate: 1500 },
    { id: 'sunset_estuary', title: 'Sunset Arabian Sea Estuary Cruise (1.5 Hrs)', rate: 1500 },
    { id: 'island_hopping', title: 'Basavaraja Durga Island & Estuary Ride (2.5 Hrs)', rate: 2500 },
    { id: 'prewedding_shoot', title: 'Exclusive Pre-Wedding Photography Charter (3 Hrs)', rate: 3500 },
];

const TIME_SLOTS = [
    '07:00 AM - Early Morning Birding Cruise',
    '09:30 AM - Morning Mangrove Explorer',
    '02:30 PM - Afternoon Calm Waters',
    '04:30 PM - Golden Hour Sunset (Most Popular)',
    '05:30 PM - Twilight Estuary Ride',
];

export default function BoatingBookingModal({
    open,
    onClose,
    initialSafariId = 'mangrove_backwater',
    availableItems = [],
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { auth } = usePage().props;

    const [safariType, setSafariType] = useState(initialSafariId);
    const [boatingDate, setBoatingDate] = useState(new Date().toISOString().slice(0, 10));
    const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[3]);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);

    const [customerName, setCustomerName] = useState(auth?.user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(auth?.user?.phone || '');
    const [customerEmail, setCustomerEmail] = useState(auth?.user?.email || '');
    const [specialNotes, setSpecialNotes] = useState('');

    const [currentUser, setCurrentUser] = useState(auth?.user || null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (auth?.user) {
            setCurrentUser(auth.user);
            if (auth.user.name && !customerName) setCustomerName(auth.user.name);
            if (auth.user.phone && !customerPhone) setCustomerPhone(auth.user.phone);
            if (auth.user.email && !customerEmail) setCustomerEmail(auth.user.email);
        }
    }, [auth?.user]);

    useEffect(() => {
        if (initialSafariId) {
            setSafariType(initialSafariId);
        }
    }, [initialSafariId, open]);

    const activeSafariObj = useMemo(
        () => BOATING_SAFARIS.find((s) => s.id === safariType) || BOATING_SAFARIS[0],
        [safariType]
    );

    const estimatedCost = useMemo(() => {
        return activeSafariObj.rate;
    }, [activeSafariObj]);

    const getBookingPayload = () => {
        const details = {
            safariName: activeSafariObj.title,
            slot: timeSlot,
            date: boatingDate,
            adults: adults,
            children: children,
            jetty: 'Sharavathi River Jetty, Honnavar',
            rate: `₹${estimatedCost}`,
        };

        const notes = [
            `Service: Backwater Boating`,
            `Safari: ${activeSafariObj.title}`,
            `Slot: ${timeSlot} on ${boatingDate}`,
            `Passengers: ${adults} Adults, ${children} Children`,
            `Departure: Sharavathi River Jetty, Honnavar`,
            `Rate: ₹${estimatedCost.toLocaleString('en-IN')}`,
            specialNotes ? `Notes: ${specialNotes}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: 'boating',
            service_item_id: null,
            customer_name: customerName.trim(),
            customer_phone: sanitizePhone(customerPhone),
            customer_email: customerEmail.trim() || null,
            start_datetime: `${boatingDate}T${timeSlot.slice(0, 5)}:00`,
            end_datetime: null,
            pickup_location: 'Sharavathi River Jetty, Honnavar',
            drop_location: 'Sharavathi River Jetty, Honnavar',
            quantity: 1, // 1 boat charter/ticket
            payment_method: 'pay_on_arrival',
            customer_notes: notes,
            custom_amount: estimatedCost,
        };
    };

    const submitBooking = (loggedInUser = null) => {
        setSubmitting(true);
        const payload = getBookingPayload();
        if (loggedInUser) {
            if (loggedInUser.name && !payload.customer_name) payload.customer_name = loggedInUser.name;
            if (loggedInUser.phone && !payload.customer_phone) payload.customer_phone = sanitizePhone(loggedInUser.phone);
            if (loggedInUser.email && !payload.customer_email) payload.customer_email = loggedInUser.email;
        }

        router.post('/services/book', payload, {
            onError: (errs) => {
                setSubmitting(false);
                const first = Object.values(errs)[0];
                setErrorMessage(first || 'Failed to book boating slot. Please check your information.');
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    const handleConfirmBooking = (e) => {
        if (e) e.preventDefault();
        setErrorMessage('');

        if (!customerName.trim()) {
            setErrorMessage('Please enter your full name.');
            return;
        }

        if (!validatePhone(customerPhone)) {
            setErrorMessage('Please enter a valid 10-digit Indian phone number.');
            return;
        }

        if (!currentUser) {
            setAuthModalOpen(true);
            return;
        }

        submitBooking(currentUser);
    };

    const handleWhatsAppBooking = () => {
        const text = [
            `*Honnavar Boating Slot Reservation - GK WhizWheels*`,
            `• *Safari:* ${activeSafariObj.title}`,
            `• *Date:* ${boatingDate}`,
            `• *Time Slot:* ${timeSlot}`,
            `• *Passengers:* ${adults} Adults, ${children} Children`,
            `• *Boarding Jetty:* Sharavathi River Jetty, Honnavar`,
            `• *Lead Name:* ${customerName || 'Guest'}`,
            `• *Phone:* ${customerPhone || 'Not provided'}`,
            `• *Tariff:* ₹${estimatedCost.toLocaleString('en-IN')}`,
            `Hi GK WhizWheels, please confirm our boat safari reservation.`,
        ].join('\n');

        window.open(formatWhatsAppUrl(SUPPORT_WHATSAPP, text), '_blank');
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                scroll="paper"
                PaperProps={{
                    sx: {
                        borderRadius: 3.5,
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                        backgroundImage: 'none',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                    },
                }}
            >
                {/* Modal Header */}
                <DialogTitle
                    sx={{
                        p: { xs: 2.5, sm: 3 },
                        background: isDark
                            ? 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)'
                            : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#FFFFFF',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ pr: { xs: 5, sm: 6 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Chip
                                icon={<DirectionsBoatIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                label="HONNAVAR BACKWATERS"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="Life Jackets Included"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                        </Stack>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2 }}>
                            Reserve Sharavathi Boating Safari
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#A7F3D0', mt: 0.5, fontSize: '0.85rem' }}>
                            Mangrove boardwalk trails • Sunset estuary cruise • Licensed native boatmen
                        </Typography>
                    </Box>

                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: { xs: 14, sm: 18 },
                            right: { xs: 14, sm: 18 },
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            maxWidth: 36,
                            minHeight: 36,
                            maxHeight: 36,
                            p: 0,
                            borderRadius: '50%',
                            color: '#FFFFFF',
                            bgcolor: 'rgba(255, 255, 255, 0.18)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.32)',
                                transform: 'scale(1.08)',
                            },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, pt: { xs: 2.5, sm: 3 } }}>
                    {errorMessage && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMessage('')}>
                            {errorMessage}
                        </Alert>
                    )}

                    {/* Step 1: Safari Type & Slot */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DirectionsBoatIcon sx={{ fontSize: 18, color: '#059669' }} />
                            1. Select Safari & Time Slot
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Boat Safari Package"
                                    value={safariType}
                                    onChange={(e) => setSafariType(e.target.value)}
                                    size="small"
                                >
                                    {BOATING_SAFARIS.map((safari) => (
                                        <MenuItem key={safari.id} value={safari.id}>
                                            {safari.title} • ₹{safari.rate}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Date of Boat Ride"
                                    value={boatingDate}
                                    onChange={(e) => setBoatingDate(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Time Slot"
                                    value={timeSlot}
                                    onChange={(e) => setTimeSlot(e.target.value)}
                                    size="small"
                                >
                                    {TIME_SLOTS.map((slot, idx) => (
                                        <MenuItem key={idx} value={slot}>
                                            {slot}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Adults (12+ Yrs)"
                                    value={adults}
                                    onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 20 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Kids (Below 12)"
                                    value={children}
                                    onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                                    size="small"
                                    inputProps={{ min: 0, max: 10 }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Passenger Contact */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 18, color: '#059669' }} />
                            2. Lead Passenger Details
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Arun Kumar"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="10-Digit Mobile Number *"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    size="small"
                                    placeholder="e.g. 9845123456"
                                    helperText="We share exact Jetty Google Maps location on WhatsApp"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Email Address (Optional)"
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    size="small"
                                    placeholder="arun@example.com"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Boarding Jetty"
                                    value="Sharavathi River Jetty, Honnavar"
                                    disabled
                                    size="small"
                                    helperText="2.5 km from Honnavar town / Railway station"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Special Notes or Requests (Optional)"
                                    value={specialNotes}
                                    onChange={(e) => setSpecialNotes(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Need life jackets for toddlers, photography tripod onboard"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Transparent Tariff Summary Banner */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.2,
                            borderRadius: 2.5,
                            bgcolor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ECFDF5',
                            border: isDark ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid #A7F3D0',
                            mt: 2.5,
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <Box>
                                <Typography variant="caption" sx={{ color: isDark ? '#6EE7B7' : '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Official Boating Tariff
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669', lineHeight: 1.1 }}>
                                    ₹{estimatedCost.toLocaleString('en-IN')}
                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 1, fontWeight: 600 }}>
                                        for up to 6 Passengers (Entire Boat)
                                    </Typography>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                    ✓ Zero Advance Payment • Pay at Jetty in Cash or UPI
                                </Typography>
                            </Box>

                            <Chip
                                label="Safety Certified"
                                sx={{
                                    bgcolor: '#059669',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                }}
                            />
                        </Stack>
                    </Paper>
                </DialogContent>

                <DialogActions sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: isDark ? '#090E17' : '#F8FAFC', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
                        <Button
                            variant="outlined"
                            onClick={handleWhatsAppBooking}
                            startIcon={<WhatsAppIcon />}
                            sx={{
                                color: '#16A34A',
                                borderColor: '#16A34A',
                                fontWeight: 800,
                                py: 1.2,
                                px: 2.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.08)', borderColor: '#15803D' },
                            }}
                        >
                            Book via WhatsApp
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmBooking}
                            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#059669',
                                color: '#FFFFFF',
                                fontWeight: 850,
                                py: 1.2,
                                px: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                                '&:hover': { bgcolor: '#047857' },
                            }}
                        >
                            {submitting ? 'Confirming Boat Slot...' : 'Confirm Boat Reservation (Pay at Jetty) →'}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* Auth Modal if unauthenticated user clicks confirm */}
            <AuthModal
                open={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onSuccess={(user) => {
                    setAuthModalOpen(false);
                    setCurrentUser(user);
                    submitBooking(user);
                }}
            />
        </>
    );
}

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
    FormControlLabel,
    Checkbox,
    Paper,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PoolIcon from '@mui/icons-material/Pool';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { validatePhone, sanitizePhone, formatWhatsAppUrl, SUPPORT_WHATSAPP } from './bookingUtils';

const DIVE_PROGRAMS = [
    { id: 'discovery_scuba', title: 'Beginner Discovery Scuba Dive (Non-Swimmers Welcome)', rate: 3499, desc: '1-on-1 PADI Instructor • 4K GoPro Video & Photos • Island Boat Cruise' },
    { id: 'island_snorkeling', title: 'Netrani Coral Reef Snorkeling Expedition', rate: 1799, desc: 'Full Snorkel Gear • Lifejacket Floating Assist • Boat Ride' },
    { id: 'certified_dive', title: 'Certified Diver Exploration (2 Boat Dives)', rate: 2999, desc: 'Tanks, Weights, Boat Charter • Divemaster Guided' },
];

export default function ScubaBookingModal({
    open,
    onClose,
    initialProgramId = 'discovery_scuba',
    availableItems = [],
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { auth } = usePage().props;

    const [diveProgram, setDiveProgram] = useState(initialProgramId);
    const [diveDate, setDiveDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    const [paxCount, setPaxCount] = useState(2);
    const [hotelTransfer, setHotelTransfer] = useState(false);
    const [medicalConfirmed, setMedicalConfirmed] = useState(true);

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
        if (initialProgramId) {
            setDiveProgram(initialProgramId);
        }
    }, [initialProgramId, open]);

    const activeProg = useMemo(
        () => DIVE_PROGRAMS.find((p) => p.id === diveProgram) || DIVE_PROGRAMS[0],
        [diveProgram]
    );

    const estimatedCost = useMemo(() => {
        const base = activeProg.rate * paxCount;
        const transfer = hotelTransfer ? 300 * paxCount : 0;
        return base + transfer;
    }, [activeProg, paxCount, hotelTransfer]);

    const getBookingPayload = () => {
        const details = {
            program: activeProg.title,
            divers: paxCount,
            departure: '06:30 AM Murudeshwar Harbor',
            transferRequired: hotelTransfer,
            medicalConfirmed: medicalConfirmed,
        };

        const notes = [
            `Service: Netrani Scuba Diving`,
            `Program: ${activeProg.title}`,
            `Date: ${diveDate} (06:30 AM Departure)`,
            `Divers: ${paxCount} Pax | Murudeshwar Transfer: ${hotelTransfer ? 'Yes (+₹300/pax)' : 'Direct Arrival'}`,
            `Govt / Medical Fitness: Confirmed (${medicalConfirmed ? 'Yes' : 'No'})`,
            `Total: ₹${estimatedCost.toLocaleString('en-IN')}`,
            specialNotes ? `Notes: ${specialNotes}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: 'scuba',
            service_item_id: null,
            customer_name: customerName.trim(),
            customer_phone: sanitizePhone(customerPhone),
            customer_email: customerEmail.trim() || null,
            start_datetime: `${diveDate}T06:30:00`,
            end_datetime: null,
            pickup_location: hotelTransfer ? 'Honnavar / Murudeshwar Hotel Transfer' : 'Murudeshwar Harbor Dive Dock',
            drop_location: 'Murudeshwar Harbor (Return ~01:30 PM)',
            quantity: Math.max(1, paxCount),
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
                setErrorMessage(first || 'Failed to book scuba dive. Please verify your details.');
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
            setErrorMessage('Please enter lead diver name.');
            return;
        }

        if (!validatePhone(customerPhone)) {
            setErrorMessage('Please enter a valid 10-digit Indian phone number.');
            return;
        }

        if (!medicalConfirmed) {
            setErrorMessage('Please confirm medical eligibility (Age 10+ and no severe respiratory conditions).');
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
            `*Netrani Scuba Diving Reservation Request - GK WhizWheels*`,
            `• *Dive Program:* ${activeProg.title}`,
            `• *Date:* ${diveDate} (06:30 AM Harbor Batch)`,
            `• *Divers:* ${paxCount} Pax`,
            `• *Hotel Transfer:* ${hotelTransfer ? 'Yes (+₹300/pax)' : 'Direct Arrival at Harbor'}`,
            `• *Lead Diver:* ${customerName || 'Guest'}`,
            `• *Phone:* ${customerPhone || 'Not provided'}`,
            `• *Total Estimated Tariff:* ₹${estimatedCost.toLocaleString('en-IN')}`,
            `Hi GK WhizWheels, please confirm slot availability for Netrani Island scuba diving.`,
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
                            ? 'linear-gradient(135deg, #312E81 0%, #1E1B4B 100%)'
                            : 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                        color: '#FFFFFF',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ pr: { xs: 5, sm: 6 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Chip
                                icon={<PoolIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                label="NETRANI ISLAND SCUBA"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="PADI Certified Instructors"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(16, 185, 129, 0.25)',
                                    color: '#A7F3D0',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                        </Stack>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2 }}>
                            Book Netrani Scuba Diving Adventure
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E0E7FF', mt: 0.5, fontSize: '0.85rem' }}>
                            Non-swimmers welcome • 4K underwater GoPro video included • Authorized harbor permits
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

                    {/* Step 1: Program Selection */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PoolIcon sx={{ fontSize: 18, color: '#4F46E5' }} />
                            1. Select Dive Experience & Date
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Scuba Dive Program"
                                    value={diveProgram}
                                    onChange={(e) => setDiveProgram(e.target.value)}
                                    size="small"
                                >
                                    {DIVE_PROGRAMS.map((prog) => (
                                        <MenuItem key={prog.id} value={prog.id}>
                                            {prog.title} • ₹{prog.rate}/pax
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 6, md: 2 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Divers"
                                    value={paxCount}
                                    onChange={(e) => setPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 20 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 6, md: 2 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Dive Date"
                                    value={diveDate}
                                    onChange={(e) => setDiveDate(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                            <FormControlLabel
                                control={<Checkbox size="small" checked={hotelTransfer} onChange={(e) => setHotelTransfer(e.target.checked)} sx={{ color: '#4F46E5', '&.Mui-checked': { color: '#4F46E5' } }} />}
                                label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Add Honnavar Hotel / Station AC Pickup & Drop (+₹300/pax)</Typography>}
                            />
                        </Stack>
                    </Box>

                    {/* Step 2: Medical & Safety Compliance */}
                    <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(79, 70, 229, 0.08)' : '#EEF2FF', border: isDark ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid #C7D2FE' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#A5B4FC' : '#4338CA', mb: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HealthAndSafetyIcon sx={{ fontSize: 18 }} />
                            Mandatory Government & PADI Safety Regulations
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.5, display: 'block', mb: 1.2 }}>
                            • Minimum Age: 10 Years old • No swimming skills needed (1-on-1 certified instructor holds you throughout) • Not eligible if suffering from severe asthma, epilepsy, or recent major chest surgery.
                        </Typography>
                        <FormControlLabel
                            control={<Checkbox size="small" checked={medicalConfirmed} onChange={(e) => setMedicalConfirmed(e.target.checked)} sx={{ color: '#4F46E5', '&.Mui-checked': { color: '#4F46E5' } }} />}
                            label={<Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>I confirm all participants are 10+ yrs and meet basic medical fitness requirements.</Typography>}
                        />
                    </Box>

                    {/* Step 3: Diver Contact Info */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 18, color: '#4F46E5' }} />
                            3. Lead Diver Contact Information
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Vikram Verma"
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
                                    helperText="We share harbor reporting guidelines and weather updates"
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
                                    placeholder="vikram@example.com"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Harbor Departure"
                                    value="06:30 AM Murudeshwar Harbor (Direct Report)"
                                    disabled
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Special Notes or Requests (Optional)"
                                    value={specialNotes}
                                    onChange={(e) => setSpecialNotes(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Need prescription mask, first-time diver nervous about depth"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Live Pricing Summary Banner */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.2,
                            borderRadius: 2.5,
                            bgcolor: isDark ? 'rgba(79, 70, 229, 0.12)' : '#EEF2FF',
                            border: isDark ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid #C7D2FE',
                            mt: 2.5,
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <Box>
                                <Typography variant="caption" sx={{ color: isDark ? '#A5B4FC' : '#4338CA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Total Dive Tariff (Includes 4K Video & Boat)
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#818CF8' : '#4F46E5', lineHeight: 1.1 }}>
                                    ₹{estimatedCost.toLocaleString('en-IN')}
                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 1, fontWeight: 600 }}>
                                        for {paxCount} Divers
                                    </Typography>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                    ✓ Zero Advance Payment • Pay at Murudeshwar Harbor
                                </Typography>
                            </Box>

                            <Chip
                                label="Weather Guaranteed"
                                sx={{
                                    bgcolor: '#4F46E5',
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
                            WhatsApp Dive Desk
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmBooking}
                            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#4F46E5',
                                color: '#FFFFFF',
                                fontWeight: 850,
                                py: 1.2,
                                px: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                                '&:hover': { bgcolor: '#4338CA' },
                            }}
                        >
                            {submitting ? 'Confirming Dive Slot...' : 'Confirm Scuba Reservation (Pay on Arrival) →'}
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

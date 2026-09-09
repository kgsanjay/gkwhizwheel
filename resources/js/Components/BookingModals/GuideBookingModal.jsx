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
import ExploreIcon from '@mui/icons-material/Explore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TranslateIcon from '@mui/icons-material/Translate';
import { validatePhone, sanitizePhone, formatWhatsAppUrl, SUPPORT_WHATSAPP } from './bookingUtils';

const GUIDE_TRAILS = [
    { id: 'mirjan_heritage', title: 'Mirjan Fort & Pepper Queen Citadel Walk', duration: 'half_day', rateHalf: 800, rateFull: 1500 },
    { id: 'honnavar_mangroves', title: 'Honnavar Mangroves, Apsarakonda & Sunset Trail', duration: 'half_day', rateHalf: 800, rateFull: 1500 },
    { id: 'yana_vibhooti', title: 'Yana Karst Monoliths & Vibhooti Rainforest Trek', duration: 'full_day', rateHalf: 1200, rateFull: 1500 },
    { id: 'gokarna_beaches', title: 'Gokarna Mahabaleshwar & 5-Beach Cliff Trail', duration: 'full_day', rateHalf: 1200, rateFull: 1500 },
    { id: 'custom_nature', title: 'Custom Unexplored Waterfall & Village Trail', duration: 'half_day', rateHalf: 800, rateFull: 1500 },
];

export default function GuideBookingModal({
    open,
    onClose,
    initialTrailId = 'mirjan_heritage',
    availableItems = [],
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { auth } = usePage().props;

    const [selectedTrail, setSelectedTrail] = useState(initialTrailId);
    const [duration, setDuration] = useState('half_day'); // half_day, full_day
    const [guideDate, setGuideDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    const [timeSlot, setTimeSlot] = useState('morning'); // morning, afternoon, full_day
    const [groupSize, setGroupSize] = useState(2);
    const [language, setLanguage] = useState('Kannada & English');

    const [customerName, setCustomerName] = useState(auth?.user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(auth?.user?.phone || '');
    const [customerEmail, setCustomerEmail] = useState(auth?.user?.email || '');
    const [meetingPoint, setMeetingPoint] = useState('Honnavar Railway Station');
    const [specialInterests, setSpecialInterests] = useState('');

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
        if (initialTrailId) {
            setSelectedTrail(initialTrailId);
        }
    }, [initialTrailId, open]);

    const activeTrailObj = useMemo(
        () => GUIDE_TRAILS.find((t) => t.id === selectedTrail) || GUIDE_TRAILS[0],
        [selectedTrail]
    );

    // Calculate Flat Fee
    const guideTariff = useMemo(() => {
        return duration === 'full_day' ? 1500 : 800;
    }, [duration]);

    const getBookingPayload = () => {
        const details = {
            trail: activeTrailObj.title,
            duration: duration === 'full_day' ? 'Full Day (7-8 Hours)' : 'Half Day (3.5-4 Hours)',
            date: guideDate,
            slot: timeSlot,
            groupSize: groupSize,
            language: language,
            meetingPoint: meetingPoint,
            specialInterests: specialInterests,
        };

        const notes = [
            `Service: Certified Native Tour Guide`,
            `Trail: ${activeTrailObj.title}`,
            `Duration: ${duration === 'full_day' ? 'Full Day (7-8 Hrs)' : 'Half Day (3.5-4 Hrs)'} | Slot: ${timeSlot}`,
            `Group Size: ${groupSize} Pax | Languages: ${language}`,
            `Meeting Point: ${meetingPoint}`,
            `Flat Tariff: ₹${guideTariff} (No Commission)`,
            specialInterests ? `Special Interests / Notes: ${specialInterests}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: 'guide',
            service_item_id: null,
            customer_name: customerName.trim(),
            customer_phone: sanitizePhone(customerPhone),
            customer_email: customerEmail.trim() || null,
            start_datetime: `${guideDate}T${timeSlot === 'afternoon' ? '15:00:00' : '08:30:00'}`,
            end_datetime: null,
            pickup_location: meetingPoint.trim() || 'Honnavar Local Hub',
            drop_location: 'Trail Concludes at Starting Hub',
            quantity: 1, // 1 guide booking
            payment_method: 'pay_on_arrival',
            customer_notes: notes,
            custom_amount: guideTariff,
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
                setErrorMessage(first || 'Failed to book tour guide. Please check your contact information.');
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
            `*Tour Guide Booking Request - GK WhizWheels*`,
            `• *Trail:* ${activeTrailObj.title}`,
            `• *Duration:* ${duration === 'full_day' ? 'Full Day (7-8 Hours)' : 'Half Day (3.5-4 Hours)'}`,
            `• *Date:* ${guideDate} (${timeSlot})`,
            `• *Group Size:* ${groupSize} Pax`,
            `• *Preferred Language:* ${language}`,
            `• *Meeting Point:* ${meetingPoint}`,
            `• *Lead Name:* ${customerName || 'Guest'}`,
            `• *Phone:* ${customerPhone || 'Not provided'}`,
            `• *Flat Guide Tariff:* ₹${guideTariff}`,
            `Hi GK WhizWheels, please confirm a certified native guide for this trail.`,
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
                            ? 'linear-gradient(135deg, #78350F 0%, #451A03 100%)'
                            : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                        color: '#FFFFFF',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ pr: { xs: 5, sm: 6 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Chip
                                icon={<ExploreIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                label="CERTIFIED LOCAL GUIDES"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="Zero Commission • Flat Tariff"
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
                            Book Native Coastal Storyteller Guide
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FEF3C7', mt: 0.5, fontSize: '0.85rem' }}>
                            Verified background-checked locals • Deep historical knowledge • Hidden photo spots & forest paths
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

                    {/* Step 1: Trail & Duration */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ExploreIcon sx={{ fontSize: 18, color: '#D97706' }} />
                            1. Select Circuit & Duration
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Curated Trail Circuit"
                                    value={selectedTrail}
                                    onChange={(e) => setSelectedTrail(e.target.value)}
                                    size="small"
                                >
                                    {GUIDE_TRAILS.map((trail) => (
                                        <MenuItem key={trail.id} value={trail.id}>
                                            {trail.title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Trail Duration"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="half_day">Half Day (3.5 - 4 Hours) • ₹800</MenuItem>
                                    <MenuItem value="full_day">Full Day (7 - 8 Hours) • ₹1,500</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Trek / Tour Date"
                                    value={guideDate}
                                    onChange={(e) => setGuideDate(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 6, sm: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Preferred Slot"
                                    value={timeSlot}
                                    onChange={(e) => setTimeSlot(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="morning">Morning (08:30 AM)</MenuItem>
                                    <MenuItem value="afternoon">Afternoon / Sunset (03:00 PM)</MenuItem>
                                    <MenuItem value="full_day">Full Day (09:00 AM)</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 6, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Group Size (Pax)"
                                    value={groupSize}
                                    onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 20 }}
                                    helperText="1-6 pax covered under flat rate"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Language & Meeting Location */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TranslateIcon sx={{ fontSize: 18, color: '#D97706' }} />
                            2. Guide Languages & Meeting Hub
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Preferred Language"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="Kannada & English">Kannada & English (Native Standard)</MenuItem>
                                    <MenuItem value="Hindi & English">Hindi & English</MenuItem>
                                    <MenuItem value="Kannada & Hindi">Kannada & Hindi</MenuItem>
                                    <MenuItem value="Konkani & Kannada">Konkani & Kannada</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Meeting / Pickup Point"
                                    value={meetingPoint}
                                    onChange={(e) => setMeetingPoint(e.target.value)}
                                    size="small"
                                    placeholder="Honnavar Station / Hotel / Hub"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 3: Traveler Contact */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 18, color: '#D97706' }} />
                            3. Lead Traveler Contact
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Priya Nair"
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
                                    helperText="We share your guide's direct contact upon confirmation"
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
                                    placeholder="priya@example.com"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Special Interests (Optional)"
                                    value={specialInterests}
                                    onChange={(e) => setSpecialInterests(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Birdwatching, photography, ancient history"
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
                            bgcolor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#FFFBEB',
                            border: isDark ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid #FDE68A',
                            mt: 2.5,
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <Box>
                                <Typography variant="caption" sx={{ color: isDark ? '#FCD34D' : '#B45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Official Flat Rate Guide Fee
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#D97706', lineHeight: 1.1 }}>
                                    ₹{guideTariff.toLocaleString('en-IN')}
                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 1, fontWeight: 600 }}>
                                        for group of up to {groupSize > 6 ? groupSize : 6} Pax
                                    </Typography>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                    ✓ Zero Advance Payment • Pay Guide in Cash or UPI After Tour
                                </Typography>
                            </Box>

                            <Chip
                                label="Govt Registered Native"
                                sx={{
                                    bgcolor: '#D97706',
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
                            Chat on WhatsApp
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmBooking}
                            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#D97706',
                                color: '#FFFFFF',
                                fontWeight: 850,
                                py: 1.2,
                                px: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                                '&:hover': { bgcolor: '#B45309' },
                            }}
                        >
                            {submitting ? 'Confirming Guide...' : 'Confirm Guide Booking (Pay on Arrival) →'}
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

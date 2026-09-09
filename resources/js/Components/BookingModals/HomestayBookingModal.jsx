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
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { validatePhone, sanitizePhone, formatWhatsAppUrl, SUPPORT_WHATSAPP } from './bookingUtils';

const STAY_ROOMS = [
    { id: 'riverfront_cottage', title: 'Sharavathi Riverfront Wooden Cottage', ratePerNight: 2200, paxLimit: 3 },
    { id: 'beachside_room', title: 'Beachside Heritage Room (Eco Beach)', ratePerNight: 1500, paxLimit: 2 },
    { id: 'private_villa', title: 'Private Eco Estuary Villa (Family / Group)', ratePerNight: 5500, paxLimit: 8 },
];

export default function HomestayBookingModal({
    open,
    onClose,
    initialRoomId = 'riverfront_cottage',
    availableItems = [],
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { auth } = usePage().props;

    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);

    const [roomType, setRoomType] = useState(initialRoomId);
    const [checkin, setCheckin] = useState(todayStr);
    const [checkout, setCheckout] = useState(tomorrowStr);
    const [guests, setGuests] = useState(2);
    const [rooms, setRooms] = useState(1);
    const [mealPlan, setMealPlan] = useState('breakfast_included'); // room_only, breakfast_included, breakfast_dinner

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
        if (initialRoomId) {
            setRoomType(initialRoomId);
        }
    }, [initialRoomId, open]);

    const activeRoomObj = useMemo(
        () => STAY_ROOMS.find((r) => r.id === roomType) || STAY_ROOMS[0],
        [roomType]
    );

    const nights = useMemo(() => {
        const start = new Date(checkin);
        const end = new Date(checkout);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
    }, [checkin, checkout]);

    const estimatedCost = useMemo(() => {
        const base = activeRoomObj.ratePerNight * rooms * nights;
        let mealRate = 0;
        if (mealPlan === 'breakfast_included') mealRate = 150 * guests * nights;
        if (mealPlan === 'breakfast_dinner') mealRate = 550 * guests * nights;
        return base + mealRate;
    }, [activeRoomObj, rooms, nights, mealPlan, guests]);

    const getBookingPayload = () => {
        const details = {
            room: activeRoomObj.title,
            checkin: checkin,
            checkout: checkout,
            nights: nights,
            rooms: rooms,
            guests: guests,
            mealPlan: mealPlan,
        };

        const notes = [
            `Service: Coastal Homestays`,
            `Property: ${activeRoomObj.title}`,
            `Dates: ${checkin} to ${checkout} (${nights} Nights)`,
            `Rooms: ${rooms} | Guests: ${guests} Pax`,
            `Meal Plan: ${mealPlan}`,
            `Total: ₹${estimatedCost.toLocaleString('en-IN')}`,
            specialNotes ? `Notes: ${specialNotes}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: 'homestay',
            service_item_id: null,
            customer_name: customerName.trim(),
            customer_phone: sanitizePhone(customerPhone),
            customer_email: customerEmail.trim() || null,
            start_datetime: `${checkin}T12:00:00`,
            end_datetime: `${checkout}T10:00:00`,
            pickup_location: 'Honnavar Coastal Homestay Hub',
            drop_location: 'Honnavar Coastal Homestay Hub',
            quantity: Math.max(1, rooms),
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
                setErrorMessage(first || 'Failed to book homestay room. Please verify your details.');
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
            setErrorMessage('Please enter guest full name.');
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
            `*Coastal Homestay Reservation Inquiry - GK WhizWheels*`,
            `• *Property:* ${activeRoomObj.title}`,
            `• *Check-in:* ${checkin} (12:00 PM)`,
            `• *Check-out:* ${checkout} (10:00 AM) • ${nights} Nights`,
            `• *Guests:* ${guests} Pax in ${rooms} Room(s)`,
            `• *Meal Plan:* ${mealPlan}`,
            `• *Lead Guest:* ${customerName || 'Guest'} (${customerPhone || 'Not provided'})`,
            `• *Estimated Tariff:* ₹${estimatedCost.toLocaleString('en-IN')}`,
            `Hi GK WhizWheels, please confirm cottage availability for our stay.`,
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
                            ? 'linear-gradient(135deg, #881337 0%, #4C0519 100%)'
                            : 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                        color: '#FFFFFF',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ pr: { xs: 5, sm: 6 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Chip
                                icon={<HomeWorkIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                label="COASTAL HOMESTAYS"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="Verified Local Hosts"
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
                            Reserve Coastal Homestay & Cottages
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFE4E6', mt: 0.5, fontSize: '0.85rem' }}>
                            Sharavathi riverfront wooden cottages • Authentic Malnad home cooking • 100% peaceful privacy
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

                    {/* Step 1: Stay & Dates */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HomeWorkIcon sx={{ fontSize: 18, color: '#E11D48' }} />
                            1. Select Stay & Travel Dates
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Property & Room Category"
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    size="small"
                                >
                                    {STAY_ROOMS.map((room) => (
                                        <MenuItem key={room.id} value={room.id}>
                                            {room.title} • ₹{room.ratePerNight}/night
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Check-in Date"
                                    value={checkin}
                                    onChange={(e) => setCheckin(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Check-out Date"
                                    value={checkout}
                                    onChange={(e) => setCheckout(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    helperText={`${nights} Night(s) Stay`}
                                />
                            </Grid>

                            <Grid size={{ xs: 6, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Guests (Pax)"
                                    value={guests}
                                    onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 20 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 6, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Rooms Required"
                                    value={rooms}
                                    onChange={(e) => setRooms(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 6 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Meal Plan"
                                    value={mealPlan}
                                    onChange={(e) => setMealPlan(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="room_only">Room Only</MenuItem>
                                    <MenuItem value="breakfast_included">Breakfast Included (+₹150)</MenuItem>
                                    <MenuItem value="breakfast_dinner">Breakfast + Coastal Dinner (+₹550)</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Guest Details */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 18, color: '#E11D48' }} />
                            2. Lead Guest Details
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Deepika Hegde"
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
                                    helperText="We share exact property GPS location & host phone"
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
                                    placeholder="deepika@example.com"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Estimated Arrival Time (Optional)"
                                    value={specialNotes}
                                    onChange={(e) => setSpecialNotes(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Arriving around 01:30 PM by car"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Transparent Fare Summary Banner */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.2,
                            borderRadius: 2.5,
                            bgcolor: isDark ? 'rgba(225, 29, 72, 0.12)' : '#FFF1F2',
                            border: isDark ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid #FECDD3',
                            mt: 2.5,
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <Box>
                                <Typography variant="caption" sx={{ color: isDark ? '#FDA4AF' : '#BE123C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Total Stay Tariff ({nights} Nights • {rooms} Room)
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FB7185' : '#E11D48', lineHeight: 1.1 }}>
                                    ₹{estimatedCost.toLocaleString('en-IN')}
                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 1, fontWeight: 600 }}>
                                        all taxes included
                                    </Typography>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                    ✓ Zero Advance Payment • Pay Host at Check-in
                                </Typography>
                            </Box>

                            <Chip
                                label="Homestay Assured"
                                sx={{
                                    bgcolor: '#E11D48',
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
                            Contact Host on WhatsApp
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmBooking}
                            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#E11D48',
                                color: '#FFFFFF',
                                fontWeight: 850,
                                py: 1.2,
                                px: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                                '&:hover': { bgcolor: '#BE123C' },
                            }}
                        >
                            {submitting ? 'Confirming Stay...' : 'Confirm Stay Reservation (Pay on Arrival) →'}
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

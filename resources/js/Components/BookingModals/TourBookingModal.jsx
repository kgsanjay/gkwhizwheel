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
    Divider,
    Alert,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Paper,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import SailingIcon from '@mui/icons-material/Sailing';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { validatePhone, sanitizePhone, formatWhatsAppUrl, SUPPORT_WHATSAPP } from './bookingUtils';

const TOUR_PACKAGES = [
    { id: '2d1n_karavali', title: '2D/1N Coastal Karavali Explorer', duration: '2 Days / 1 Night', basePrice: 4999 },
    { id: '3d2n_safari', title: '3D/2N Complete Coastal Karnataka Safari', duration: '3 Days / 2 Nights', basePrice: 8999 },
    { id: '4d3n_heritage', title: '4D/3N Heritage Forts & Rainforest Waterfalls', duration: '4 Days / 3 Nights', basePrice: 12999 },
    { id: '5d4n_grand', title: '5D/4N Grand Karavali & Western Ghats Expedition', duration: '5 Days / 4 Nights', basePrice: 16999 },
    { id: 'custom_curated', title: 'Custom Designed Circuit (Tailor-Made)', duration: 'Custom Duration', basePrice: 6500 },
];

export default function TourBookingModal({
    open,
    onClose,
    initialPackageId = '2d1n_karavali',
    availableItems = [],
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { auth } = usePage().props;

    const [selectedPackage, setSelectedPackage] = useState(initialPackageId);
    const [travelers, setTravelers] = useState(2);
    const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
    const [transportType, setTransportType] = useState('cab_sedan'); // cab_sedan, cab_innova, bikes, own
    const [stayType, setStayType] = useState('riverfront_homestay'); // riverfront_homestay, coastal_resort, beachside_villa
    const [includeBoating, setIncludeBoating] = useState(true);
    const [includeScuba, setIncludeScuba] = useState(false);
    const [includeGuide, setIncludeGuide] = useState(true);

    const [customerName, setCustomerName] = useState(auth?.user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(auth?.user?.phone || '');
    const [customerEmail, setCustomerEmail] = useState(auth?.user?.email || '');
    const [pickupLocation, setPickupLocation] = useState('Honnavar Railway Station');
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
        if (initialPackageId) {
            setSelectedPackage(initialPackageId);
        }
    }, [initialPackageId, open]);

    // Calculate Estimated Price
    const estimatedCost = useMemo(() => {
        const pkgObj = TOUR_PACKAGES.find((p) => p.id === selectedPackage) || TOUR_PACKAGES[0];
        let total = pkgObj.basePrice * travelers;

        // Transport adjustment
        if (transportType === 'cab_innova') total += 1500 * (pkgObj.duration.includes('3') ? 3 : 2);
        if (transportType === 'bikes') total -= 500 * travelers;

        // Activities adjustment
        if (includeScuba) total += 3499 * travelers;
        if (!includeBoating) total -= 600 * travelers;

        return Math.max(total, 4999);
    }, [selectedPackage, travelers, transportType, stayType, includeBoating, includeScuba, includeGuide]);

    const activePkg = useMemo(
        () => TOUR_PACKAGES.find((p) => p.id === selectedPackage) || TOUR_PACKAGES[0],
        [selectedPackage]
    );

    const getBookingPayload = () => {
        const details = {
            package: activePkg.title,
            duration: activePkg.duration,
            travelers: travelers,
            transport: transportType,
            stay: stayType,
            boatingIncluded: includeBoating,
            scubaIncluded: includeScuba,
            guideIncluded: includeGuide,
            pickup: pickupLocation,
        };

        const notes = [
            `Package: ${activePkg.title} (${activePkg.duration})`,
            `Travelers: ${travelers} Pax | Transport: ${transportType} | Stay: ${stayType}`,
            `Addons: Boating=${includeBoating ? 'Yes' : 'No'}, Scuba=${includeScuba ? 'Yes' : 'No'}, Guide=${includeGuide ? 'Yes' : 'No'}`,
            `Estimate: ₹${estimatedCost.toLocaleString('en-IN')}`,
            specialNotes ? `Customer Notes: ${specialNotes}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: 'tours',
            service_item_id: null,
            customer_name: customerName.trim(),
            customer_phone: sanitizePhone(customerPhone),
            customer_email: customerEmail.trim() || null,
            start_datetime: `${startDate}T09:00:00`,
            end_datetime: null,
            pickup_location: pickupLocation.trim() || 'Honnavar Railway Station',
            drop_location: 'Honnavar (Circuit Return)',
            quantity: Math.max(1, travelers),
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
                setErrorMessage(first || 'Failed to reserve tour package. Please verify your details.');
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
            setErrorMessage('Please enter the lead traveler name.');
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
            `*Tour Package Booking Inquiry - GK WhizWheels*`,
            `• *Package:* ${activePkg.title}`,
            `• *Duration:* ${activePkg.duration}`,
            `• *Travelers:* ${travelers} Pax`,
            `• *Start Date:* ${startDate}`,
            `• *Transport:* ${transportType}`,
            `• *Stay:* ${stayType}`,
            `• *Lead Name:* ${customerName || 'Guest'}`,
            `• *Phone:* ${customerPhone || 'Not provided'}`,
            `• *Estimated Tariff:* ₹${estimatedCost.toLocaleString('en-IN')}`,
            `Hi GK WhizWheels, please confirm availability and customize this itinerary for us.`,
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
                            ? 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)'
                            : 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        color: '#FFFFFF',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ pr: { xs: 5, sm: 6 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Chip
                                icon={<LuggageIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                label="CURATED TOUR CIRCUITS"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="Zero Advance"
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
                            Reserve Karnataka Tour Package
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E9D5FF', mt: 0.5, fontSize: '0.85rem' }}>
                            All-inclusive coastal & rainforest circuits • Sanitized private vehicles • Handpicked riverfront stays
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

                    {/* Step 1: Package Selection */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonthIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
                            1. Select Circuit & Duration
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Pre-Packaged Vacation Circuit"
                                    value={selectedPackage}
                                    onChange={(e) => setSelectedPackage(e.target.value)}
                                    size="small"
                                    sx={{ mb: 1.5 }}
                                >
                                    {TOUR_PACKAGES.map((pkg) => (
                                        <MenuItem key={pkg.id} value={pkg.id}>
                                            {pkg.title} ({pkg.duration})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 6, md: 2 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Travelers"
                                    value={travelers}
                                    onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 30 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 6, md: 2 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Transport & Stay Preference */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DirectionsCarIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
                            2. Transport & Stay Preferences
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Dedicated Transport Class"
                                    value={transportType}
                                    onChange={(e) => setTransportType(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="cab_sedan">Private AC Cab - Swift Dzire / Etios Sedan</MenuItem>
                                    <MenuItem value="cab_innova">Private AC MUV - Toyota Innova Crysta / Ertiga</MenuItem>
                                    <MenuItem value="bikes">Rental Two-Wheelers (Activa 6G / Classic 350)</MenuItem>
                                    <MenuItem value="own">Self-Driven / Own Transport (Itinerary & Stays Only)</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Accommodation Type"
                                    value={stayType}
                                    onChange={(e) => setStayType(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="riverfront_homestay">Sharavathi Riverfront Wooden Cottage</MenuItem>
                                    <MenuItem value="coastal_resort">Beachside Luxury Coastal Resort Room</MenuItem>
                                    <MenuItem value="beachside_villa">Private Heritage Eco Villa</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        {/* Experience Addons */}
                        <Box sx={{ mt: 1.8, p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 1 }}>
                                INCLUDED SPECIAL EXPERIENCES:
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={includeBoating} onChange={(e) => setIncludeBoating(e.target.checked)} sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }} />}
                                        label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Sharavathi Boating Safari</Typography>}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={includeGuide} onChange={(e) => setIncludeGuide(e.target.checked)} sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }} />}
                                        label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Native Storyteller Guide</Typography>}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={includeScuba} onChange={(e) => setIncludeScuba(e.target.checked)} sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }} />}
                                        label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Netrani Scuba Diving (+₹3,499)</Typography>}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Step 3: Lead Traveler Details */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
                            3. Lead Traveler Contact & Pickup
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Rahul Sharma"
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
                                    helperText="We send instant booking confirmation on WhatsApp & SMS"
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
                                    placeholder="rahul@example.com"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Preferred Pickup Location"
                                    value={pickupLocation}
                                    onChange={(e) => setPickupLocation(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Honnavar Station / Gokarna / Hub"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Custom Requests or Dietary Preferences"
                                    value={specialNotes}
                                    onChange={(e) => setSpecialNotes(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Traveling with senior citizen, vegetarian food only, early morning check-in"
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
                            bgcolor: isDark ? 'rgba(124, 58, 237, 0.12)' : '#F5F3FF',
                            border: isDark ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid #DDD6FE',
                            mt: 2.5,
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <Box>
                                <Typography variant="caption" sx={{ color: isDark ? '#C4B5FD' : '#6D28D9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Estimated All-Inclusive Package Tariff
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#A78BFA' : '#7C3AED', lineHeight: 1.1 }}>
                                    ₹{estimatedCost.toLocaleString('en-IN')}
                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 1, fontWeight: 600 }}>
                                        for {travelers} Travelers
                                    </Typography>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                    ✓ Zero Advance Payment • Pay On Arrival in Honnavar
                                </Typography>
                            </Box>

                            <Chip
                                label="Instant Confirmation"
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
                            WhatsApp Trip Concierge
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmBooking}
                            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#7C3AED',
                                color: '#FFFFFF',
                                fontWeight: 850,
                                py: 1.2,
                                px: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                '&:hover': { bgcolor: '#6D28D9' },
                            }}
                        >
                            {submitting ? 'Confirming Reservation...' : 'Confirm Package Reservation →'}
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

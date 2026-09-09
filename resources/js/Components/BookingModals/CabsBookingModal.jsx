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
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { validatePhone, sanitizePhone, formatWhatsAppUrl, SUPPORT_WHATSAPP } from './bookingUtils';

const CAB_VEHICLES = [
    { id: 'sedan_dzire', name: 'Swift Dzire Sedan (AC • 4 Pax)', baseRate: 350, dayRate: 2500, outRate: 2800 },
    { id: 'suv_ertiga', name: 'Maruti Ertiga AC (6 Pax + Luggage)', baseRate: 500, dayRate: 3200, outRate: 3600 },
    { id: 'suv_innova', name: 'Toyota Innova Crysta AC (7 Pax)', baseRate: 650, dayRate: 3800, outRate: 4200 },
];

const POPULAR_ROUTES = [
    'Honnavar Railway Station ➔ Honnavar Eco Beach / Hub',
    'Honnavar ➔ Mirjan Fort & Apsarakonda (Half Day)',
    'Honnavar ➔ Gokarna Mahabaleshwar & Om Beach',
    'Honnavar ➔ Murudeshwar Shiva Temple & Beach',
    'Honnavar ➔ Jog Falls Sightseeing Return',
    'Honnavar ➔ Goa Dabolim / Mopa Airport Transfer',
    'Custom Route / Local Sightseeing',
];

export default function CabsBookingModal({
    open,
    onClose,
    initialTripType = 'local_transfer',
    availableItems = [],
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { auth } = usePage().props;

    const [tripType, setTripType] = useState(initialTripType); // local_transfer, day_rental, outstation
    const [selectedRoute, setSelectedRoute] = useState(POPULAR_ROUTES[0]);
    const [vehicleId, setVehicleId] = useState('sedan_dzire');
    const [pickupDatetime, setPickupDatetime] = useState(new Date().toISOString().slice(0, 16));
    const [pickupLocCustom, setPickupLocCustom] = useState('Honnavar Railway Station');
    const [dropLocCustom, setDropLocCustom] = useState('Honnavar Eco Beach');
    const [passengers, setPassengers] = useState(2);

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

    const activeVehicle = useMemo(
        () => CAB_VEHICLES.find((v) => v.id === vehicleId) || CAB_VEHICLES[0],
        [vehicleId]
    );

    const estimatedCost = useMemo(() => {
        if (tripType === 'local_transfer') return activeVehicle.baseRate;
        if (tripType === 'day_rental') return activeVehicle.dayRate;
        return activeVehicle.outRate;
    }, [tripType, activeVehicle]);

    const getBookingPayload = () => {
        const pickup = tripType === 'local_transfer' ? selectedRoute.split('➔')[0]?.trim() || pickupLocCustom : pickupLocCustom;
        const drop = tripType === 'local_transfer' ? selectedRoute.split('➔')[1]?.trim() || dropLocCustom : dropLocCustom;

        const details = {
            tripType: tripType,
            vehicle: activeVehicle.name,
            route: `${pickup} ➔ ${drop}`,
            passengers: passengers,
            pickupDatetime: pickupDatetime,
        };

        const notes = [
            `Service: Taxi & Cab Services`,
            `Trip Type: ${tripType} | Vehicle: ${activeVehicle.name}`,
            `Route: ${pickup} ➔ ${drop}`,
            `Pickup Time: ${pickupDatetime}`,
            `Passengers: ${passengers} Pax`,
            `Estimated Tariff: ₹${estimatedCost.toLocaleString('en-IN')}`,
            specialNotes ? `Notes: ${specialNotes}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: 'taxi',
            service_item_id: null,
            customer_name: customerName.trim(),
            customer_phone: sanitizePhone(customerPhone),
            customer_email: customerEmail.trim() || null,
            start_datetime: pickupDatetime,
            end_datetime: null,
            pickup_location: pickup,
            drop_location: drop,
            quantity: 1,
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
                setErrorMessage(first || 'Failed to reserve cab. Please verify your details.');
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
        const pickup = tripType === 'local_transfer' ? selectedRoute.split('➔')[0]?.trim() || pickupLocCustom : pickupLocCustom;
        const drop = tripType === 'local_transfer' ? selectedRoute.split('➔')[1]?.trim() || dropLocCustom : dropLocCustom;

        const text = [
            `*Taxi & Cab Booking Request - GK WhizWheels*`,
            `• *Trip Type:* ${tripType}`,
            `• *Vehicle:* ${activeVehicle.name}`,
            `• *Pickup:* ${pickup}`,
            `• *Drop:* ${drop}`,
            `• *Pickup Time:* ${pickupDatetime}`,
            `• *Passengers:* ${passengers} Pax`,
            `• *Customer:* ${customerName || 'Guest'} (${customerPhone || 'Not provided'})`,
            `• *Estimated Fare:* ₹${estimatedCost.toLocaleString('en-IN')}`,
            `Hi GK WhizWheels, please confirm driver dispatch and vehicle availability.`,
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
                            ? 'linear-gradient(135deg, #075985 0%, #082F49 100%)'
                            : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        color: '#FFFFFF',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ pr: { xs: 5, sm: 6 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Chip
                                icon={<LocalTaxiIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                label="COASTAL CABS & TAXIS"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                }}
                            />
                            <Chip
                                label="Commercial Permit • AC"
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
                            Book Coastal AC Cab / Taxi
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E0F2FE', mt: 0.5, fontSize: '0.85rem' }}>
                            Railway station transfers • 8hr/80km full day sightseeing • Outstation Jog & Goa drop
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

                    {/* Step 1: Trip & Vehicle */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DirectionsCarIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                            1. Select Trip Type & Vehicle
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Trip Type"
                                    value={tripType}
                                    onChange={(e) => setTripType(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="local_transfer">Station / Beach Point-to-Point Transfer</MenuItem>
                                    <MenuItem value="day_rental">Full-Day Sightseeing (8 Hours / 80 KMs)</MenuItem>
                                    <MenuItem value="outstation">Outstation Trip (Jog Falls / Goa / Murudeshwar)</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Vehicle Category"
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    size="small"
                                >
                                    {CAB_VEHICLES.map((v) => (
                                        <MenuItem key={v.id} value={v.id}>
                                            {v.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {tripType === 'local_transfer' ? (
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Popular Transfer Route"
                                        value={selectedRoute}
                                        onChange={(e) => setSelectedRoute(e.target.value)}
                                        size="small"
                                    >
                                        {POPULAR_ROUTES.map((route, i) => (
                                            <MenuItem key={i} value={route}>
                                                {route}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            ) : (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Pickup Address / Hotel"
                                            value={pickupLocCustom}
                                            onChange={(e) => setPickupLocCustom(e.target.value)}
                                            size="small"
                                            placeholder="e.g. Honnavar Railway Station"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Destination / Circuit"
                                            value={dropLocCustom}
                                            onChange={(e) => setDropLocCustom(e.target.value)}
                                            size="small"
                                            placeholder="e.g. Jog Falls & Return"
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    label="Pickup Date & Time"
                                    value={pickupDatetime}
                                    onChange={(e) => setPickupDatetime(e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Passenger Count"
                                    value={passengers}
                                    onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1, max: 7 }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Passenger Details */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                            2. Passenger Contact Details
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Manoj Gowda"
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
                                    helperText="Driver details & car number sent on SMS 30m prior"
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
                                    placeholder="manoj@example.com"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Luggage / Flight / Train No. (Optional)"
                                    value={specialNotes}
                                    onChange={(e) => setSpecialNotes(e.target.value)}
                                    size="small"
                                    placeholder="e.g. Train #12620 arriving 10:45 AM"
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
                            bgcolor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F0F9FF',
                            border: isDark ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                            mt: 2.5,
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <Box>
                                <Typography variant="caption" sx={{ color: isDark ? '#7DD3FC' : '#0369A1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Estimated Fare (Includes Fuel & Chauffeur)
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#38BDF8' : '#0284C7', lineHeight: 1.1 }}>
                                    ₹{estimatedCost.toLocaleString('en-IN')}
                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 1, fontWeight: 600 }}>
                                        {tripType === 'local_transfer' ? 'Point-to-Point Flat' : 'Base Allowance'}
                                    </Typography>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                    ✓ Zero Advance Payment • Pay Driver at the End of Trip
                                </Typography>
                            </Box>

                            <Chip
                                label="Chauffeur Driven"
                                sx={{
                                    bgcolor: '#0284C7',
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
                            Cab Desk on WhatsApp
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmBooking}
                            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#0284C7',
                                color: '#FFFFFF',
                                fontWeight: 850,
                                py: 1.2,
                                px: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                                '&:hover': { bgcolor: '#0369A1' },
                            }}
                        >
                            {submitting ? 'Confirming Cab...' : 'Confirm Cab Booking (Pay on Arrival) →'}
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

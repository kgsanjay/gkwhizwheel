import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    Box,
    Typography,
    Button,
    TextField,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    FormControlLabel,
    Checkbox,
    Alert,
    IconButton,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableContainer,
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import StoreIcon from '@mui/icons-material/Store';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';

const STEPS = [
    'Odometer & Mileage',
    'Store Hub & Fuel',
    'Damage Inspection',
    'Overdue & Late Fees',
    'Deposit Settlement',
];

export default function ReturnInspectionWizardModal({ open, onClose, booking, stores = [] }) {
    if (!booking) return null;

    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Starting values from handover
    const startOdo = useMemo(() => {
        return booking.latest_condition_log?.odometer_reading ?? booking.bike?.odometer_reading ?? 0;
    }, [booking]);

    // Step 0: Odometer
    const [odometerReading, setOdometerReading] = useState(String(startOdo));

    // Step 1: Store & Fuel
    const [returnStoreId, setReturnStoreId] = useState(
        booking.return_store?.id ?? booking.pickup_store?.id ?? (stores[0]?.id || '')
    );
    const [fuelLevel, setFuelLevel] = useState('Full (100%)');
    const [helmetsReturned, setHelmetsReturned] = useState(true);

    // Step 2: Damage & Photos
    const [damageFee, setDamageFee] = useState('0');
    const [damageNotes, setDamageNotes] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);

    // Step 3: Overdue & Late Fee
    const scheduledEnd = useMemo(() => {
        if (!booking.end_date) return new Date();
        const d = new Date(booking.end_date);
        d.setHours(23, 59, 59, 999);
        return d;
    }, [booking.end_date]);

    const isOverdue = useMemo(() => {
        return new Date() > scheduledEnd;
    }, [scheduledEnd]);

    const overdueDays = useMemo(() => {
        if (!isOverdue) return 0;
        const diffMs = new Date() - scheduledEnd;
        return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }, [isOverdue, scheduledEnd]);

    const dailyRate = useMemo(() => {
        return booking.bike?.base_daily_rate || 500;
    }, [booking.bike]);

    const autoLateFee = useMemo(() => {
        return overdueDays * dailyRate;
    }, [overdueDays, dailyRate]);

    const [lateFeeOverride, setLateFeeOverride] = useState('');

    const effectiveLateFee = useMemo(() => {
        if (lateFeeOverride !== '') {
            return Math.max(0, parseFloat(lateFeeOverride) || 0);
        }
        return autoLateFee;
    }, [lateFeeOverride, autoLateFee]);

    // Step 4: Deposit Settlement
    const originalDeposit = useMemo(() => {
        return parseFloat(booking.deposit_amount) || 0;
    }, [booking.deposit_amount]);

    const parsedDamageFee = useMemo(() => {
        return Math.max(0, parseFloat(damageFee) || 0);
    }, [damageFee]);

    const calculatedRefund = useMemo(() => {
        return Math.max(0, Math.round((originalDeposit - parsedDamageFee - effectiveLateFee) * 100) / 100);
    }, [originalDeposit, parsedDamageFee, effectiveLateFee]);

    const [customRefundAmount, setCustomRefundAmount] = useState('');
    const [refundMode, setRefundMode] = useState('Original Mode (Auto/UPI)');

    const finalRefundAmount = useMemo(() => {
        if (customRefundAmount !== '') {
            return Math.max(0, parseFloat(customRefundAmount) || 0);
        }
        return calculatedRefund;
    }, [customRefundAmount, calculatedRefund]);

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            setSubmitting(false);
            setFormError('');
            const odo = booking.latest_condition_log?.odometer_reading ?? booking.bike?.odometer_reading ?? 0;
            setOdometerReading(String(odo));
            setReturnStoreId(booking.return_store?.id ?? booking.pickup_store?.id ?? (stores[0]?.id || ''));
            setFuelLevel('Full (100%)');
            setHelmetsReturned(true);
            setDamageFee('0');
            setDamageNotes('');
            setPhotos([]);
            setPhotoPreviews([]);
            setLateFeeOverride('');
            setCustomRefundAmount('');
            setRefundMode('Original Mode (Auto/UPI)');
        }
    }, [open, booking, stores]);

    const handlePhotoAdd = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const combined = [...photos, ...files].slice(0, 6);
        setPhotos(combined);

        const newPreviews = combined.map((file) => URL.createObjectURL(file));
        setPhotoPreviews(newPreviews);
    };

    const handleRemovePhoto = (index) => {
        const updatedFiles = photos.filter((_, i) => i !== index);
        const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
        setPhotos(updatedFiles);
        setPhotoPreviews(updatedPreviews);
    };

    const handleNext = () => {
        setFormError('');
        if (activeStep === 0) {
            const ending = parseInt(odometerReading, 10);
            if (isNaN(ending) || ending < 0) {
                setFormError('Please enter a valid ending odometer reading.');
                return;
            }
            if (ending < startOdo) {
                setFormError(`Ending odometer (${ending} km) cannot be less than starting odometer (${startOdo} km).`);
                return;
            }
        } else if (activeStep === 1) {
            if (!helmetsReturned) {
                setFormError('Helmets must be physically inspected and returned before completing return.');
                return;
            }
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setFormError('');
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = () => {
        setFormError('');
        const ending = parseInt(odometerReading, 10);
        if (isNaN(ending) || ending < startOdo) {
            setFormError(`Ending odometer must be at least ${startOdo} km.`);
            return;
        }

        setSubmitting(true);

        const formData = new FormData();
        formData.append('odometer_reading', ending);
        formData.append('return_store_id', returnStoreId);
        formData.append('fuel_level', fuelLevel);
        formData.append('damage_fee', parsedDamageFee);
        formData.append('late_fee_override', effectiveLateFee);
        formData.append('deposit_refund_amount', finalRefundAmount);
        if (damageNotes) formData.append('notes', damageNotes);

        photos.forEach((photo) => {
            formData.append('condition_photos[]', photo);
        });

        router.post(`/admin/bookings/${booking.id}/return`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onClose();
            },
            onError: (errors) => {
                setSubmitting(false);
                const firstErr = Object.values(errors)[0] || 'Return inspection failed. Please check inputs.';
                setFormError(firstErr);
            },
        });
    };

    const distanceTraveled = useMemo(() => {
        const ending = parseInt(odometerReading, 10);
        if (isNaN(ending) || ending < startOdo) return 0;
        return ending - startOdo;
    }, [odometerReading, startOdo]);

    const isRelocated = useMemo(() => {
        return String(returnStoreId) !== String(booking.pickup_store?.id);
    }, [returnStoreId, booking.pickup_store]);

    return (
        <Dialog open={open} onClose={submitting ? null : onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'warning.main',
                            color: 'warning.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <AssignmentReturnIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Return & Settlement Wizard
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Booking {booking.booking_reference} • {booking.bike?.model} ({booking.bike?.registration_number})
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} disabled={submitting} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {formError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {formError}
                    </Alert>
                )}

                {/* STEP 0: Odometer & Mileage */}
                {activeStep === 0 && (
                    <Stack spacing={2.5}>
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">
                                            Handover Odometer
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700}>
                                            {startOdo} km
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">
                                            Current Ending Odometer
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="primary.main">
                                            {odometerReading || 0} km
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">
                                            Trip Distance Travelled
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="success.main">
                                            +{distanceTraveled} km
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <TextField
                            fullWidth
                            label="Return Odometer Reading (km)"
                            type="number"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            helperText={`Must be equal to or greater than starting reading (${startOdo} km)`}
                            InputProps={{
                                startAdornment: <SpeedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Stack>
                )}

                {/* STEP 1: Store Hub & Fuel */}
                {activeStep === 1 && (
                    <Stack spacing={2.5}>
                        <TextField
                            select
                            fullWidth
                            label="Drop-Off Store / Jetty Hub"
                            value={returnStoreId}
                            onChange={(e) => setReturnStoreId(e.target.value)}
                            helperText="Bike fleet inventory will automatically be relocated to this store"
                            SelectProps={{ native: true }}
                            InputProps={{
                                startAdornment: <StoreIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        >
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.city})
                                </option>
                            ))}
                        </TextField>

                        {isRelocated && (
                            <Alert severity="warning" icon={<WarningAmberIcon />}>
                                <strong>Multi-Store Relocation:</strong> This bike was picked up at{' '}
                                <strong>{booking.pickup_store?.name}</strong> and is being returned at a different store.
                                The bike status will be set to AVAILABLE at this new location.
                            </Alert>
                        )}

                        <TextField
                            select
                            fullWidth
                            label="Return Fuel Level"
                            value={fuelLevel}
                            onChange={(e) => setFuelLevel(e.target.value)}
                            SelectProps={{ native: true }}
                            InputProps={{
                                startAdornment: <LocalGasStationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        >
                            <option value="Full (100%)">Full (100%)</option>
                            <option value="3/4 (75%)">3/4 (75%)</option>
                            <option value="Half (50%)">Half (50%)</option>
                            <option value="1/4 (25%)">1/4 (25%)</option>
                            <option value="Reserve / Low">Reserve / Low</option>
                        </TextField>

                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SportsMotorsportsIcon color="primary" fontSize="small" />
                                Gear Inspection
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={helmetsReturned}
                                        onChange={(e) => setHelmetsReturned(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="All issued helmets returned intact without cracks and sanitized"
                            />
                        </Box>
                    </Stack>
                )}

                {/* STEP 2: Damage Inspection */}
                {activeStep === 2 && (
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label="Damage Fee (₹) - Enter 0 if no damage"
                            type="number"
                            value={damageFee}
                            onChange={(e) => setDamageFee(e.target.value)}
                            helperText="Will be deducted directly from security deposit"
                            InputProps={{
                                startAdornment: <CurrencyRupeeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Damage Description / Condition Notes"
                            placeholder="e.g. Scratched right rear view mirror; tail light intact."
                            value={damageNotes}
                            onChange={(e) => setDamageNotes(e.target.value)}
                        />

                        <Box
                            sx={{
                                border: '2px dashed',
                                borderColor: 'warning.main',
                                borderRadius: 2,
                                p: 2.5,
                                textAlign: 'center',
                                bgcolor: 'action.hover',
                            }}
                        >
                            <PhotoCameraIcon sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Return Condition Photos (Up to 6)
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                Required if damage or scratches are noted.
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<PhotoCameraIcon />}
                                disabled={photos.length >= 6}
                            >
                                Upload Return Photos
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handlePhotoAdd}
                                />
                            </Button>
                        </Box>

                        {photoPreviews.length > 0 && (
                            <Grid container spacing={1.5}>
                                {photoPreviews.map((src, index) => (
                                    <Grid item xs={4} sm={2} key={index}>
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                borderRadius: 1.5,
                                                overflow: 'hidden',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                aspectRatio: '1',
                                            }}
                                        >
                                            <img
                                                src={src}
                                                alt={`Return Condition ${index + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemovePhoto(index)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    bgcolor: 'rgba(0,0,0,0.6)',
                                                    color: '#FFFFFF',
                                                    '&:hover': { bgcolor: 'error.main' },
                                                    p: 0.5,
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Stack>
                )}

                {/* STEP 3: Overdue & Late Fees */}
                {activeStep === 3 && (
                    <Stack spacing={2.5}>
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">Scheduled Return</Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            {booking.end_date} (End of Day)
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">Overdue Status</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            {isOverdue ? (
                                                <Chip
                                                    label={`${overdueDays} Day(s) Overdue`}
                                                    color="error"
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            ) : (
                                                <Chip
                                                    label="Returned On Time"
                                                    color="success"
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">Daily Rate</Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            ₹{dailyRate} / day
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {isOverdue && (
                            <Alert severity="warning">
                                Booking is past scheduled return date. Auto-calculated late fee is{' '}
                                <strong>₹{autoLateFee}</strong> ({overdueDays} day(s) × ₹{dailyRate}).
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                label="Late Fee Amount (₹)"
                                type="number"
                                value={lateFeeOverride !== '' ? lateFeeOverride : String(autoLateFee)}
                                onChange={(e) => setLateFeeOverride(e.target.value)}
                                helperText="Override or adjust late fee if authorized"
                                InputProps={{
                                    startAdornment: <CurrencyRupeeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                }}
                            />
                            {autoLateFee > 0 && (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => setLateFeeOverride('0')}
                                    sx={{ whiteSpace: 'nowrap', height: 56 }}
                                >
                                    Waive Fee (₹0)
                                </Button>
                            )}
                        </Box>
                    </Stack>
                )}

                {/* STEP 4: Deposit Settlement */}
                {activeStep === 4 && (
                    <Stack spacing={2.5}>
                        <TableContainer component={Card} variant="outlined">
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Security Deposit Held</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            ₹{originalDeposit.toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: 'error.main' }}>Less: Damage Deduction</TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                                            - ₹{parsedDamageFee.toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: 'warning.main' }}>Less: Late Fee Deduction</TableCell>
                                        <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>
                                            - ₹{effectiveLateFee.toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '1rem' }}>
                                            Net Deposit Refundable to Customer
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'success.main' }}>
                                            ₹{finalRefundAmount.toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Custom Refund Amount (₹) (Optional Override)"
                                    type="number"
                                    placeholder={String(calculatedRefund)}
                                    value={customRefundAmount}
                                    onChange={(e) => setCustomRefundAmount(e.target.value)}
                                    helperText="Leave blank to use auto-calculated amount"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Settlement Payment Mode"
                                    value={refundMode}
                                    onChange={(e) => setRefundMode(e.target.value)}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="Original Mode (Auto/UPI)">Original Mode (Auto/UPI)</option>
                                    <option value="Cash Refund at Counter">Cash Refund at Counter</option>
                                    <option value="Instant UPI Handover">Instant UPI Handover</option>
                                </TextField>
                            </Grid>
                        </Grid>

                        <Alert severity="success">
                            Upon confirmation, the bike status will immediately flip to <strong>AVAILABLE</strong> at{' '}
                            <strong>
                                {stores.find((s) => String(s.id) === String(returnStoreId))?.name || 'Selected Store'}
                            </strong>
                            , and the refund record will be generated automatically.
                        </Alert>
                    </Stack>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button onClick={handleBack} disabled={activeStep === 0 || submitting} variant="text">
                    Back
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} disabled={submitting} color="inherit">
                        Cancel
                    </Button>
                    {activeStep < STEPS.length - 1 ? (
                        <Button onClick={handleNext} variant="contained" color="primary">
                            Next Step
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            color="success"
                            disabled={submitting}
                            startIcon={<CheckCircleIcon />}
                        >
                            {submitting ? 'Settling...' : 'Complete Return & Settle Deposit'}
                        </Button>
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
}

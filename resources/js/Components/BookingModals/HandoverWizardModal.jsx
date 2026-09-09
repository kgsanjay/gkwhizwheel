import React, { useState, useRef, useEffect } from 'react';
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
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    Alert,
    IconButton,
    Divider,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';

const STEPS = ['Customer & Helmets', 'Odometer & Fuel', 'Condition Photos', 'Digital Signature & Release'];

export default function HandoverWizardModal({ open, onClose, booking }) {
    if (!booking) return null;

    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [helmetsIssued, setHelmetsIssued] = useState(1);
    const [dlVerified, setDlVerified] = useState(true);
    const [safetyBriefingGiven, setSafetyBriefingGiven] = useState(true);
    const [odometerReading, setOdometerReading] = useState(
        booking.bike?.odometer_reading != null ? String(booking.bike.odometer_reading) : '0'
    );
    const [fuelLevel, setFuelLevel] = useState('Full (100%)');
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [staffBypassSignature, setStaffBypassSignature] = useState(false);
    const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
    const [formError, setFormError] = useState('');

    // HTML5 Canvas for Signature
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            setSubmitting(false);
            setHelmetsIssued(1);
            setDlVerified(true);
            setSafetyBriefingGiven(true);
            setOdometerReading(booking.bike?.odometer_reading != null ? String(booking.bike.odometer_reading) : '0');
            setFuelLevel('Full (100%)');
            setNotes('');
            setPhotos([]);
            setPhotoPreviews([]);
            setStaffBypassSignature(false);
            setHasDrawnSignature(false);
            setFormError('');
        }
    }, [open, booking]);

    // Setup canvas when step 3 is reached
    useEffect(() => {
        if (activeStep === 3 && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#1976D2';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [activeStep]);

    const startDrawing = (e) => {
        if (staffBypassSignature) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        isDrawingRef.current = true;
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e) => {
        if (!isDrawingRef.current || staffBypassSignature) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        setHasDrawnSignature(true);
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawnSignature(false);
    };

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
            if (!dlVerified) {
                setFormError('Driving license physical verification is required before bike handover.');
                return;
            }
        } else if (activeStep === 1) {
            const odo = parseInt(odometerReading, 10);
            if (isNaN(odo) || odo < 0) {
                setFormError('Please enter a valid starting odometer reading (0 or higher).');
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
        const odo = parseInt(odometerReading, 10);
        if (isNaN(odo) || odo < 0) {
            setFormError('Valid odometer reading is required.');
            return;
        }

        let signatureData = null;
        if (staffBypassSignature) {
            signatureData = 'COUNTER_STAFF_VERIFIED_IN_PERSON';
        } else if (canvasRef.current && hasDrawnSignature) {
            signatureData = canvasRef.current.toDataURL('image/png');
        }

        setSubmitting(true);

        const formData = new FormData();
        formData.append('odometer_reading', odo);
        formData.append('helmets_issued', helmetsIssued);
        formData.append('fuel_level', fuelLevel);
        if (notes) formData.append('notes', notes);
        if (signatureData) formData.append('signature', signatureData);

        photos.forEach((photo) => {
            formData.append('condition_photos[]', photo);
        });

        router.post(`/admin/bookings/${booking.id}/handover`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onClose();
            },
            onError: (errors) => {
                setSubmitting(false);
                const firstErr = Object.values(errors)[0] || 'Handover submission failed. Please review inputs.';
                setFormError(firstErr);
            },
        });
    };

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
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <TwoWheelerIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Bike Handover Inspection Wizard
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
                {/* Stepper Header */}
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

                {/* STEP 0: Customer & Helmets Verification */}
                {activeStep === 0 && (
                    <Stack spacing={2.5}>
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Rider / Customer
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            {booking.user?.name || 'Guest Rider'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {booking.user?.phone || 'No phone'} • {booking.user?.email || 'No email'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Assigned Store & Rental Window
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {booking.pickup_store?.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {booking.start_date} to {booking.end_date}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SportsMotorsportsIcon color="primary" fontSize="small" />
                                Safety Gear & Helmet Allocation
                            </Typography>
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontSize: '0.85rem' }}>
                                    How many sanitized helmets are being issued?
                                </FormLabel>
                                <RadioGroup
                                    row
                                    value={helmetsIssued}
                                    onChange={(e) => setHelmetsIssued(parseInt(e.target.value, 10))}
                                >
                                    <FormControlLabel value={1} control={<Radio size="small" />} label="1 Helmet (Solo Rider)" />
                                    <FormControlLabel value={2} control={<Radio size="small" />} label="2 Helmets (Rider + Pillion)" />
                                </RadioGroup>
                            </FormControl>
                        </Box>

                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                Verification Checklist
                            </Typography>
                            <Stack spacing={0.5}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={dlVerified}
                                            onChange={(e) => setDlVerified(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Customer presented valid original Driving License (DL) matching name"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={safetyBriefingGiven}
                                            onChange={(e) => setSafetyBriefingGiven(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Vehicle controls & safety guidelines briefed (Honnavar / Coastal Speed Limit 50 km/h)"
                                />
                            </Stack>
                        </Box>
                    </Stack>
                )}

                {/* STEP 1: Odometer & Fuel Check */}
                {activeStep === 1 && (
                    <Stack spacing={2.5}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Starting Odometer (km)"
                                    type="number"
                                    value={odometerReading}
                                    onChange={(e) => setOdometerReading(e.target.value)}
                                    helperText="Verify with physical bike meter reading"
                                    InputProps={{
                                        startAdornment: <SpeedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Starting Fuel Level"
                                    value={fuelLevel}
                                    onChange={(e) => setFuelLevel(e.target.value)}
                                    helperText="Customer is required to return at the same level"
                                    SelectProps={{
                                        native: true,
                                    }}
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
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Pre-existing Scratches or Mechanical Notes (Optional)"
                            placeholder="e.g. Minor hairline scratch on left rear fender; front brake pads newly adjusted."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Stack>
                )}

                {/* STEP 2: Condition Photos */}
                {activeStep === 2 && (
                    <Stack spacing={2}>
                        <Box
                            sx={{
                                border: '2px dashed',
                                borderColor: 'primary.main',
                                borderRadius: 2,
                                p: 3,
                                textAlign: 'center',
                                bgcolor: 'action.hover',
                            }}
                        >
                            <PhotoCameraIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                                Capture Handover Photos (Up to 6)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Recommended: Front, Rear, Left side, Right side, Odometer cluster, and Helmet condition.
                            </Typography>
                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<PhotoCameraIcon />}
                                disabled={photos.length >= 6}
                            >
                                Take / Upload Photos
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
                                                alt={`Condition ${index + 1}`}
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

                {/* STEP 3: Digital Signature & Release */}
                {activeStep === 3 && (
                    <Stack spacing={2.5}>
                        {/* Summary Pill */}
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="text.secondary">Odometer</Typography>
                                        <Typography variant="body2" fontWeight={700}>{odometerReading} km</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="text.secondary">Fuel Level</Typography>
                                        <Typography variant="body2" fontWeight={700}>{fuelLevel}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="text.secondary">Helmets</Typography>
                                        <Typography variant="body2" fontWeight={700}>{helmetsIssued} Issued</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="text.secondary">Security Deposit</Typography>
                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                            ₹{booking.deposit_amount?.toLocaleString('en-IN') || '0'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Signature Pad */}
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DrawIcon fontSize="small" color="primary" />
                                    Customer Agreement & Signature
                                </Typography>
                                {!staffBypassSignature && (
                                    <Button size="small" onClick={clearCanvas} color="inherit">
                                        Clear
                                    </Button>
                                )}
                            </Box>

                            {!staffBypassSignature ? (
                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        bgcolor: 'background.paper',
                                        cursor: 'crosshair',
                                        touchAction: 'none',
                                    }}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        width={560}
                                        height={160}
                                        style={{ width: '100%', height: '160px', display: 'block' }}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                </Box>
                            ) : (
                                <Alert severity="info">
                                    Customer is unable to digitally sign on device. Staff witness verification will be recorded.
                                </Alert>
                            )}

                            <Box sx={{ mt: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={staffBypassSignature}
                                            onChange={(e) => setStaffBypassSignature(e.target.checked)}
                                            size="small"
                                        />
                                    }
                                    label="Bypass canvas signature (In-person counter staff verification)"
                                />
                            </Box>
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0 || submitting}
                    variant="text"
                >
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
                            disabled={submitting || (!staffBypassSignature && !hasDrawnSignature)}
                            startIcon={<CheckCircleIcon />}
                        >
                            {submitting ? 'Confirming...' : 'Release Bike & Handover'}
                        </Button>
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
}

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
import DirectionsIcon from '@mui/icons-material/Directions';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';

export default function BookingConfirmation({ booking }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';
    const bike = booking.bike || {};
    const pickupStore = booking.pickup_store || {};
    const returnStore = booking.return_store || {};
    const addons = booking.addons || [];
    const payments = booking.payments || [];
    const latestPayment = payments[0] || null;

    const isOneWay = pickupStore.id !== returnStore.id;
    const isElectric = bike.fuel_type === 'electric';

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout>
            <Head title={`Booking Confirmed - ${booking.booking_reference} - GK WhizWheel`} />
            <Box sx={{ maxWidth: '1410px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>

            {/* Back to fleet bar */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button component={Link} href="/bikes" startIcon={<ArrowBackIcon />} sx={{ color: '#64748B' }}>
                    Browse More Fleet
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1' }}>
                    Print Receipt
                </Button>
            </Box>

            {/* Success Hero Banner */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, md: 4 },
                    mb: 4,
                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    borderRadius: 4,
                    textAlign: 'center',
                }}
            >
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 44 }} />
                </Box>

                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1 }}>
                    Booking Confirmed!
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#64748B', maxWidth: 600, mx: 'auto', mb: 2 }}>
                    Your vehicle is locked and reserved. A confirmation email and WhatsApp message have been sent to your registered contacts.
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                        label={`Reference: ${booking.booking_reference}`}
                        sx={{
                            bgcolor: '#0F172A',
                            color: '#FFFFFF',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            py: 2,
                            px: 1,
                        }}
                    />
                    <Chip
                        label={`Status: ${booking.status?.toUpperCase() || 'CONFIRMED'}`}
                        color="success"
                        sx={{ fontWeight: 700 }}
                    />
                    {latestPayment && (
                        <Chip
                            label={`Paid via ${latestPayment.payment_method?.toUpperCase() || 'GATEWAY'}`}
                            sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 600 }}
                        />
                    )}
                </Box>
            </Paper>

            <Grid container spacing={4}>
                {/* Left Column: Trip & Vehicle Overview */}
                <Grid size={{ xs: 12, md: 7 }}>
                    {/* Vehicle Card */}
                    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', bgcolor: isDark ? '#131D2F' : '#FFFFFF', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                        <Box
                            sx={{
                                p: 2.5,
                                bgcolor: '#0F172A',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <TwoWheelerIcon sx={{ color: '#F59E0B', fontSize: 32 }} />
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                                        {bike.brand} {bike.model_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                        {bike.category?.name || 'Two-Wheeler'} • {isElectric ? 'Electric EV' : 'Petrol'} • {bike.transmission}
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                label={bike.registration_number || 'REG-PENDING'}
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                                    color: '#FFFFFF',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                }}
                            />
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            {/* Rental Schedule & Store Hubs */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                Trip Schedule & Hub Locations
                            </Typography>

                            <Grid container spacing={2}>
                                {/* Pickup Store */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <LocationOnIcon sx={{ color: '#10B981', fontSize: 20 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                Pick-up Store
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {pickupStore.name || 'Bengaluru Hub'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                                            {pickupStore.address_line}, {pickupStore.city} - {pickupStore.pincode}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
                                            <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                Start: {booking.start_date}
                                            </Typography>
                                        </Box>
                                        {pickupStore.phone && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569', mt: 0.5 }}>
                                                <PhoneIcon sx={{ fontSize: 14 }} />
                                                <Typography variant="caption">
                                                    Hub Contact: {pickupStore.phone}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box
                                            component="a"
                                            href={pickupStore.name && pickupStore.name.toLowerCase().includes('railway')
                                                ? 'https://www.google.com/maps/dir/?api=1&destination=Honnavar+Railway+Station,+Karnataka'
                                                : 'https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334'}
                                            target="_blank"
                                            rel="noreferrer"
                                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', mt: 1, '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            <DirectionsIcon sx={{ fontSize: 14 }} /> Get Directions to Hub ↗
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Return Store */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <LocationOnIcon sx={{ color: '#EA580C', fontSize: 20 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                Drop-off Store {isOneWay && '(One-Way)'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {returnStore.name || 'Bengaluru Hub'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                                            {returnStore.address_line}, {returnStore.city} - {returnStore.pincode}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
                                            <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                Return: {booking.end_date}
                                            </Typography>
                                        </Box>
                                        {returnStore.phone && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569', mt: 0.5 }}>
                                                <PhoneIcon sx={{ fontSize: 14 }} />
                                                <Typography variant="caption">
                                                    Hub Contact: {returnStore.phone}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* KYC Handover Instructions */}
                    <Paper elevation={0} sx={{ p: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0', borderRadius: 3, bgcolor: isDark ? '#131D2F' : '#FFFFFF', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <BadgeIcon color="primary" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                Required for Handover at Store
                            </Typography>
                        </Box>
                        <Stack spacing={1}>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                                1. <strong>Original Driving License:</strong> Must be presented by the primary rider at pickup.
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                                2. <strong>Government Photo ID:</strong> Aadhaar, Passport, or Voter ID for identity verification.
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                                3. <strong>Odometer & Condition Inspection:</strong> Staff will conduct a 360° photo inspection with you before key handover.
                            </Typography>
                        </Stack>
                    </Paper>

                    {/* Digital Vehicle Documents Deep-Link */}
                    <Paper elevation={0} sx={{ p: 3, border: '1px dashed #CBD5E1', borderRadius: 3, bgcolor: '#F8FAFC' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <DescriptionIcon color="secondary" sx={{ fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        Digital Bike Documents
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                                        Access Insurance certificate, Emission PUC, and RC digitally during your trip.
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                component="a"
                                href={`/api/v1/bookings/${booking.id}/documents`}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                color="primary"
                                startIcon={<DescriptionIcon />}
                                sx={{ fontWeight: 600 }}
                            >
                                View Vehicle Documents
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column: Payment & Receipt Summary */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
                        <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptLongIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                Payment Receipt
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Base Rental</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            ₹{Number(booking.base_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>

                                    {Number(booking.pricing_adjustments_amount || 0) > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Adjustments</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#EA580C' }}>
                                                + ₹{Number(booking.pricing_adjustments_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {Number(booking.one_way_fee_amount || 0) > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>One-Way Store Fee</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#EA580C' }}>
                                                + ₹{Number(booking.one_way_fee_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {addons.length > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>
                                                Add-ons ({addons.length} items)
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                + ₹{Number(booking.addon_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {Number(booking.discount_amount || 0) > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#10B981', fontWeight: 500 }}>Coupon Discount</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: '#10B981' }}>
                                                - ₹{Number(booking.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>
                                            Refundable Deposit
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            ₹{Number(booking.deposit_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem', pt: 2 }}>
                                            Total Paid
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.25rem', pt: 2 }}>
                                            ₹{Number(booking.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            <Divider sx={{ my: 2 }} />

                            {latestPayment && (
                                <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                        Gateway Reference ID:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                        {latestPayment.gateway_reference || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                                        Payment Method:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                        {latestPayment.payment_method} ({latestPayment.status})
                                    </Typography>
                                </Box>
                            )}

                            <Alert icon={<VerifiedUserIcon fontSize="inherit" />} severity="success" sx={{ mt: 2.5 }}>
                                The ₹{Number(booking.deposit_amount || 0).toLocaleString('en-IN')} security deposit is 100% refundable upon vehicle return and inspection.
                            </Alert>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
                    </Box>
        </AppLayout>
    );
}

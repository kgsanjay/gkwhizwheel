import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Divider,
    Alert,
    CircularProgress,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PersonIcon from '@mui/icons-material/Person';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';

export default function BookingsEdit({
    booking = {},
    stores = [],
    statuses = [],
}) {
    const { data, setData, put, processing, errors } = useForm({
        start_date: booking.start_date || '',
        end_date: booking.end_date || '',
        pickup_store_id: booking.pickup_store_id || '',
        return_store_id: booking.return_store_id || '',
        status: booking.status || 'confirmed',
        late_fee_amount: booking.late_fee_amount || 0,
        damage_fee_amount: booking.damage_fee_amount || 0,
        admin_notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/admin/bookings/${booking.id}`);
    };

    return (
        <AdminLayout title={`Edit Booking ${booking.booking_reference}`}>
            <Head title={`Edit Booking ${booking.booking_reference} - Admin`} />

            {/* Header Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button
                        component={Link}
                        href="/admin/bookings"
                        startIcon={<ArrowBackIcon />}
                        variant="outlined"
                        size="small"
                    >
                        Back to Bookings
                    </Button>
                    <Typography variant="h5" fontWeight={700}>
                        {booking.booking_reference}
                    </Typography>
                    <Chip
                        label={booking.channel === 'online' ? 'Online' : 'Walk-in'}
                        size="small"
                        color={booking.channel === 'online' ? 'primary' : 'default'}
                    />
                </Box>

                {booking.paid_amount > 0 && (
                    <Button
                        component={Link}
                        href={`/admin/bookings/${booking.id}/refund`}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<CurrencyRupeeIcon />}
                    >
                        Process Refund
                    </Button>
                )}
            </Box>

            {/* Error banner */}
            {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Please correct the errors below:
                    <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                        {Object.entries(errors).map(([field, msg]) => (
                            <li key={field}>{msg}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Main Edit Form */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <EditCalendarIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>
                                    Booking Details & Schedule
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2.5}>
                                    {/* Dates */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            type="date"
                                            label="Rental Start Date"
                                            fullWidth
                                            required
                                            InputLabelProps={{ shrink: true }}
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            error={Boolean(errors.start_date)}
                                            helperText={errors.start_date}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            type="date"
                                            label="Rental End Date"
                                            fullWidth
                                            required
                                            InputLabelProps={{ shrink: true }}
                                            value={data.end_date}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                            error={Boolean(errors.end_date)}
                                            helperText={errors.end_date}
                                        />
                                    </Grid>

                                    {/* Stores */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            label="Pickup Store Hub"
                                            fullWidth
                                            required
                                            value={data.pickup_store_id}
                                            onChange={(e) => setData('pickup_store_id', Number(e.target.value))}
                                            error={Boolean(errors.pickup_store_id)}
                                            helperText={errors.pickup_store_id}
                                        >
                                            {stores.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.name} ({s.city})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            label="Return Store Hub"
                                            fullWidth
                                            required
                                            value={data.return_store_id}
                                            onChange={(e) => setData('return_store_id', Number(e.target.value))}
                                            error={Boolean(errors.return_store_id)}
                                            helperText={errors.return_store_id}
                                        >
                                            {stores.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.name} ({s.city})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    {/* Status Transition */}
                                    <Grid item xs={12}>
                                        <TextField
                                            select
                                            label="Booking Status"
                                            fullWidth
                                            required
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            error={Boolean(errors.status)}
                                            helperText={errors.status || 'Admins can transition status for operational corrections'}
                                        >
                                            {statuses.map((st) => (
                                                <MenuItem key={st.value} value={st.value}>
                                                    {st.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    {/* Fee Adjustments */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            type="number"
                                            label="Late Fee Deduction (₹)"
                                            fullWidth
                                            value={data.late_fee_amount}
                                            onChange={(e) => setData('late_fee_amount', e.target.value)}
                                            error={Boolean(errors.late_fee_amount)}
                                            helperText={errors.late_fee_amount}
                                            InputProps={{ inputProps: { min: 0, step: 'any' } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            type="number"
                                            label="Damage Fee Deduction (₹)"
                                            fullWidth
                                            value={data.damage_fee_amount}
                                            onChange={(e) => setData('damage_fee_amount', e.target.value)}
                                            error={Boolean(errors.damage_fee_amount)}
                                            helperText={errors.damage_fee_amount}
                                            InputProps={{ inputProps: { min: 0, step: 'any' } }}
                                        />
                                    </Grid>

                                    {/* Internal Notes */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Admin Notes / Reason for Modification"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder="Document reasons for date changes or fee overrides..."
                                            value={data.admin_notes}
                                            onChange={(e) => setData('admin_notes', e.target.value)}
                                            error={Boolean(errors.admin_notes)}
                                            helperText={errors.admin_notes}
                                        />
                                    </Grid>

                                    {/* Actions */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                                            <Button
                                                component={Link}
                                                href="/admin/bookings"
                                                variant="outlined"
                                                color="inherit"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                                disabled={processing}
                                            >
                                                Save Changes
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar: Customer & Pricing Summary */}
                <Grid item xs={12} md={5}>
                    <Stack spacing={3}>
                        {/* Customer & Bike Info */}
                        <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="primary" /> Customer Profile
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {booking.user?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Email: {booking.user?.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Phone: {booking.user?.phone}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TwoWheelerIcon color="secondary" /> Assigned Bike
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {booking.bike?.model}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Reg: {booking.bike?.registration_number}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Category: {booking.bike?.category || 'Standard'}
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* Financial Breakdown */}
                        <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ReceiptLongIcon color="primary" /> Financial Summary
                                </Typography>

                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Base Rental</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.base_amount?.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                        {booking.one_way_fee_amount > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ pl: 0, color: 'text.secondary' }}>One-way Inter-hub Fee</TableCell>
                                                <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.one_way_fee_amount?.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        )}
                                        {booking.addon_amount > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Addons / Gear</TableCell>
                                                <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.addon_amount?.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        )}
                                        {booking.discount_amount > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ pl: 0, color: 'success.main' }}>Coupon Discount</TableCell>
                                                <TableCell align="right" sx={{ pr: 0, color: 'success.main', fontWeight: 600 }}>-₹{booking.discount_amount?.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Security Deposit</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.deposit_amount?.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                        {booking.late_fee_amount > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ pl: 0, color: 'warning.main' }}>Late Return Fee</TableCell>
                                                <TableCell align="right" sx={{ pr: 0, color: 'warning.main', fontWeight: 600 }}>+₹{booking.late_fee_amount?.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        )}
                                        {booking.damage_fee_amount > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ pl: 0, color: 'error.main' }}>Damage / Repair Fee</TableCell>
                                                <TableCell align="right" sx={{ pr: 0, color: 'error.main', fontWeight: 600 }}>+₹{booking.damage_fee_amount?.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, fontWeight: 700 }}>Total Booking Cost</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 700, fontSize: 16, color: 'primary.main' }}>
                                                ₹{booking.total_amount?.toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, fontWeight: 600, color: 'success.main' }}>Total Paid Online/Offline</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 700, color: 'success.main' }}>
                                                ₹{booking.paid_amount?.toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </AdminLayout>
    );
}

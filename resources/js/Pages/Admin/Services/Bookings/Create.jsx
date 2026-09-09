import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Grid,
    Stack,
    Divider,
    InputAdornment,
    Alert,
    RadioGroup,
    Radio,
    FormControlLabel,
    FormControl,
    FormLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import StoreIcon from '@mui/icons-material/Store';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function ServiceBookingCreate({ serviceConfig = {}, items = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        service_item_id: items.length > 0 ? items[0].id : '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        booking_channel: 'offline_walkin',
        start_datetime: new Date().toISOString().slice(0, 16),
        end_datetime: '',
        pickup_location: 'Palya Main Rd Hub, Honnavar',
        drop_location: '',
        quantity: 1,
        base_amount: items.length > 0 ? items[0].price_base : 0,
        discount_amount: 0,
        advance_paid: 0,
        payment_method: 'cash',
        status: 'confirmed',
        customer_notes: '',
        admin_notes: '',
    });

    const selectedItem = items.find((i) => i.id === Number(data.service_item_id));

    // When service item changes, recalculate base price
    const handleItemChange = (itemId) => {
        const item = items.find((i) => i.id === Number(itemId));
        setData((prev) => ({
            ...prev,
            service_item_id: itemId,
            base_amount: item ? parseFloat(item.price_base) * Number(prev.quantity || 1) : prev.base_amount,
        }));
    };

    // When quantity changes, update base price
    const handleQuantityChange = (qty) => {
        const q = Math.max(1, parseInt(qty) || 1);
        setData((prev) => ({
            ...prev,
            quantity: q,
            base_amount: selectedItem ? parseFloat(selectedItem.price_base) * q : prev.base_amount,
        }));
    };

    const calculatedTotal = Math.max(0, parseFloat(data.base_amount || 0) - parseFloat(data.discount_amount || 0));
    const calculatedBalance = Math.max(0, calculatedTotal - parseFloat(data.advance_paid || 0));

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/services/${serviceConfig.slug}/bookings`);
    };

    return (
        <AdminLayout title={`Create Offline ${serviceConfig.title} Booking`}>
            <Head title={`New Offline Booking - ${serviceConfig.title}`} />

            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 950, mx: 'auto' }}>
                <Box sx={{ mb: 3 }}>
                    <Button
                        component={Link}
                        href={`/admin/services/${serviceConfig.slug}/bookings`}
                        startIcon={<ArrowBackIcon />}
                        sx={{ textTransform: 'none', color: 'text.secondary', mb: 1 }}
                    >
                        Back to {serviceConfig.title} Bookings
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Create Offline Booking ({serviceConfig.title})
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Book walk-in tourists or phone inquiries with instant token/cash collection.
                    </Typography>
                </Box>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* Booking Source Channel */}
                                <Grid item xs={12}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            Reservation Type / Booking Channel
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            value={data.booking_channel}
                                            onChange={(e) => setData('booking_channel', e.target.value)}
                                            sx={{ mt: 0.5 }}
                                        >
                                            <FormControlLabel
                                                value="offline_walkin"
                                                control={<Radio size="small" />}
                                                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><StoreIcon fontSize="small" sx={{ color: 'success.main' }} /> Walk-in Customer (Store Hub)</Box>}
                                            />
                                            <FormControlLabel
                                                value="offline_phone"
                                                control={<Radio size="small" />}
                                                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><PhoneInTalkIcon fontSize="small" sx={{ color: 'primary.main' }} /> Phone Call / WhatsApp Inquiry</Box>}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                    <Divider sx={{ mt: 2 }} />
                                </Grid>

                                {/* Service Item / Package Selection */}
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        select
                                        label={`Select ${serviceConfig.item_label}`}
                                        required
                                        fullWidth
                                        value={data.service_item_id}
                                        onChange={(e) => handleItemChange(e.target.value)}
                                        error={Boolean(errors.service_item_id)}
                                        helperText={errors.service_item_id || 'Choose the exact vehicle, package, or offering'}
                                    >
                                        {items.map((it) => (
                                            <MenuItem key={it.id} value={it.id}>
                                                {it.name} — ₹{parseFloat(it.price_base).toLocaleString('en-IN')} / {it.price_unit.replace('_', ' ')}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        type="number"
                                        label="Quantity / Pax / Days"
                                        required
                                        fullWidth
                                        value={data.quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        error={Boolean(errors.quantity)}
                                        helperText="Number of persons, days, or rooms"
                                    />
                                </Grid>

                                {/* Customer Details */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon fontSize="small" sx={{ color: 'secondary.main' }} /> Customer Information
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Customer Full Name"
                                        required
                                        fullWidth
                                        value={data.customer_name}
                                        onChange={(e) => setData('customer_name', e.target.value)}
                                        error={Boolean(errors.customer_name)}
                                        helperText={errors.customer_name}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="10-Digit Mobile Number"
                                        required
                                        fullWidth
                                        value={data.customer_phone}
                                        onChange={(e) => setData('customer_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        error={Boolean(errors.customer_phone)}
                                        helperText={errors.customer_phone || 'WhatsApp active number for voucher'}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Email Address (Optional)"
                                        type="email"
                                        fullWidth
                                        value={data.customer_email}
                                        onChange={(e) => setData('customer_email', e.target.value)}
                                        error={Boolean(errors.customer_email)}
                                        helperText="For digital invoice"
                                    />
                                </Grid>

                                {/* Date, Time & Pickup Location */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationOnIcon fontSize="small" sx={{ color: 'secondary.main' }} /> Schedule & Locations
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Start Date & Time"
                                        type="datetime-local"
                                        required
                                        fullWidth
                                        value={data.start_datetime}
                                        onChange={(e) => setData('start_datetime', e.target.value)}
                                        error={Boolean(errors.start_datetime)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="End Date & Time (Optional)"
                                        type="datetime-local"
                                        fullWidth
                                        value={data.end_datetime}
                                        onChange={(e) => setData('end_datetime', e.target.value)}
                                        error={Boolean(errors.end_datetime)}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="For multi-day taxi trips or stays"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Pickup Point / Meeting Spot"
                                        required
                                        fullWidth
                                        value={data.pickup_location}
                                        onChange={(e) => setData('pickup_location', e.target.value)}
                                        error={Boolean(errors.pickup_location)}
                                        helperText="e.g. Palya Main Rd Hub, Railway Station, Boat Jetty"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Drop Location / Destination"
                                        fullWidth
                                        value={data.drop_location}
                                        onChange={(e) => setData('drop_location', e.target.value)}
                                        error={Boolean(errors.drop_location)}
                                        helperText="e.g. Murudeshwar, Gokarna, Eco Beach"
                                    />
                                </Grid>

                                {/* Financial Calculations */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, mt: 1 }}>
                                        Pricing & Payment Collection
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Base Amount (₹)"
                                        required
                                        type="number"
                                        fullWidth
                                        value={data.base_amount}
                                        onChange={(e) => setData('base_amount', parseFloat(e.target.value) || 0)}
                                        error={Boolean(errors.base_amount)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon fontSize="small" /></InputAdornment>,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Discount (₹)"
                                        type="number"
                                        fullWidth
                                        value={data.discount_amount}
                                        onChange={(e) => setData('discount_amount', parseFloat(e.target.value) || 0)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon fontSize="small" /></InputAdornment>,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Advance Paid On Spot (₹)"
                                        required
                                        type="number"
                                        fullWidth
                                        value={data.advance_paid}
                                        onChange={(e) => setData('advance_paid', parseFloat(e.target.value) || 0)}
                                        error={Boolean(errors.advance_paid)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon fontSize="small" /></InputAdornment>,
                                        }}
                                        helperText="Enter 0 if paying on arrival"
                                    />
                                </Grid>

                                {/* Total Summary Box */}
                                <Grid item xs={12}>
                                    <Card sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2.5, border: '1px dashed rgba(0,0,0,0.12)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                                    NET PAYABLE TOTAL
                                                </Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
                                                    ₹{calculatedTotal.toLocaleString('en-IN')}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                                    ADVANCE COLLECTED
                                                </Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>
                                                    ₹{parseFloat(data.advance_paid || 0).toLocaleString('en-IN')}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                                    REMAINING BALANCE DUE
                                                </Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 900, color: calculatedBalance > 0 ? 'error.main' : 'success.main' }}>
                                                    ₹{calculatedBalance.toLocaleString('en-IN')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        label="Payment Method / Mode"
                                        fullWidth
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                    >
                                        <MenuItem value="cash">Cash at Counter</MenuItem>
                                        <MenuItem value="upi">UPI / GPay / PhonePe</MenuItem>
                                        <MenuItem value="card">Credit / Debit Card</MenuItem>
                                        <MenuItem value="pay_on_arrival">Pay on Arrival / Tour Start</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        label="Initial Booking Status"
                                        fullWidth
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <MenuItem value="confirmed">Confirmed (Scheduled)</MenuItem>
                                        <MenuItem value="in_progress">In Progress (Active Now)</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Customer Special Requests"
                                        multiline
                                        rows={2}
                                        fullWidth
                                        value={data.customer_notes}
                                        onChange={(e) => setData('customer_notes', e.target.value)}
                                        placeholder="e.g. Needs baby car seat, vegetarian meal, early morning pickup"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Staff Internal Notes"
                                        multiline
                                        rows={2}
                                        fullWidth
                                        value={data.admin_notes}
                                        onChange={(e) => setData('admin_notes', e.target.value)}
                                        placeholder="e.g. Assigned Chauffeur Santosh (+91 9448...), Boat #2 allocated"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                                        <Button
                                            component={Link}
                                            href={`/admin/services/${serviceConfig.slug}/bookings`}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="secondary"
                                            disabled={processing}
                                            startIcon={<SaveIcon />}
                                            sx={{ fontWeight: 800, textTransform: 'none', px: 4 }}
                                        >
                                            {processing ? 'Creating Booking...' : 'Create & Confirm Offline Booking'}
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </AdminLayout>
    );
}

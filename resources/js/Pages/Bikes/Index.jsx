import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import apiClient from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Chip,
    TextField,
    MenuItem,
    Paper,
    CircularProgress,
    Alert,
    Stack,
    Divider,
    InputAdornment,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export default function BikesIndex({ categories = [], stores = [], initialFilters = {} }) {
    const [filters, setFilters] = useState({
        category_id: initialFilters.category_id || '',
        store_id: initialFilters.store_id || '',
        min_price: initialFilters.min_price || '',
        max_price: initialFilters.max_price || '',
        start_date: initialFilters.start_date || '',
        end_date: initialFilters.end_date || '',
    });

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        setFilters({
            category_id: '',
            store_id: '',
            min_price: '',
            max_price: '',
            start_date: '',
            end_date: '',
        });
    };

    // Clean active params (omit empty strings)
    const activeParams = Object.entries(filters).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
            acc[key] = val;
        }
        return acc;
    }, {});

    // React Query to fetch bikes
    const {
        data: bikesResponse,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['bikes', activeParams],
        queryFn: () => apiClient.get('/bikes', { params: activeParams }),
        keepPreviousData: true,
    });

    const bikes = bikesResponse?.data || [];

    return (
        <AppLayout>
            <Head title="Browse Fleet - GK WhizWheel" />

            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                    Explore Our Two-Wheeler Fleet
                </Typography>
                <Typography variant="subtitle1">
                    Select your pickup dates, preferred store location, or vehicle category to check instant availability.
                </Typography>
            </Box>

            {/* Filter Panel */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 4,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 3,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterAltIcon color="primary" fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Search & Filter Fleet
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    {/* Category Filter */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Category"
                            value={filters.category_id}
                            onChange={(e) => handleFilterChange('category_id', e.target.value)}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Store Filter */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Pickup Hub"
                            value={filters.store_id}
                            onChange={(e) => handleFilterChange('store_id', e.target.value)}
                        >
                            <MenuItem value="">All Hubs (Bengaluru)</MenuItem>
                            {stores.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                    {store.name} ({store.city})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Start Date */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            InputLabelProps={{ shrink: true }}
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        />
                    </Grid>

                    {/* End Date */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            type="date"
                            label="End Date"
                            InputLabelProps={{ shrink: true }}
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        />
                    </Grid>

                    {/* Min Price */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Min Daily Rate"
                            placeholder="e.g. 500"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                            value={filters.min_price}
                            onChange={(e) => handleFilterChange('min_price', e.target.value)}
                        />
                    </Grid>

                    {/* Max Price */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Max Daily Rate"
                            placeholder="e.g. 1500"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                            value={filters.max_price}
                            onChange={(e) => handleFilterChange('max_price', e.target.value)}
                        />
                    </Grid>

                    {/* Filter Actions */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RestartAltIcon />}
                            onClick={handleReset}
                            sx={{ color: '#64748B', borderColor: '#CBD5E1' }}
                        >
                            Reset Filters
                        </Button>
                        {bikes.length > 0 && (
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                                Showing {bikes.length} available bike(s)
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Display */}
            {isError && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error?.message || 'Failed to load bikes from catalog. Please try again.'}
                </Alert>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress color="secondary" />
                </Box>
            )}

            {/* Empty State */}
            {!isLoading && !isError && bikes.length === 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        py: 8,
                        px: 3,
                        textAlign: 'center',
                        border: '1px dashed #CBD5E1',
                        borderRadius: 3,
                        bgcolor: '#FFFFFF',
                    }}
                >
                    <TwoWheelerIcon sx={{ fontSize: 60, color: '#94A3B8', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        No bikes found matching your criteria
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
                        Try widening your price range, choosing different rental dates, or clearing your category filters.
                    </Typography>
                    <Button variant="contained" color="secondary" onClick={handleReset}>
                        Clear All Filters
                    </Button>
                </Paper>
            )}

            {/* Bike Catalog Grid */}
            {!isLoading && !isError && bikes.length > 0 && (
                <Grid container spacing={3}>
                    {bikes.map((bike) => {
                        const dailyRate = bike.base_daily_rate_override || bike.category?.base_daily_rate || '0.00';
                        const deposit = bike.deposit_amount_override || bike.category?.default_deposit_amount || '0.00';
                        const isElectric = bike.fuel_type === 'electric';

                        // Forward dates in query params to detail page if selected
                        const queryParams = new URLSearchParams();
                        if (filters.start_date) queryParams.set('start_date', filters.start_date);
                        if (filters.end_date) queryParams.set('end_date', filters.end_date);
                        if (filters.store_id) queryParams.set('pickup_store_id', filters.store_id);
                        const detailUrl = `/bikes/${bike.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

                        return (
                            <Grid item key={bike.id} xs={12} sm={6} md={4}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                                        },
                                    }}
                                >
                                    {/* Bike Card Header / Image Area */}
                                    <Box
                                        sx={{
                                            height: 180,
                                            background: isElectric
                                                ? 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)'
                                                : 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            p: 2,
                                        }}
                                    >
                                        <TwoWheelerIcon sx={{ fontSize: 90, color: 'rgba(255, 255, 255, 0.25)' }} />

                                        {/* Electric or Fuel Badge */}
                                        <Chip
                                            icon={
                                                isElectric ? (
                                                    <ElectricBoltIcon sx={{ color: '#F59E0B !important' }} />
                                                ) : (
                                                    <LocalGasStationIcon sx={{ color: '#E2E8F0 !important' }} />
                                                )
                                            }
                                            label={isElectric ? 'Electric EV' : 'Petrol'}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                bgcolor: isElectric ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.15)',
                                                color: isElectric ? '#F59E0B' : '#FFFFFF',
                                                fontWeight: 700,
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                            }}
                                        />

                                        {/* Registration badge */}
                                        <Chip
                                            label={bike.registration_number}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 12,
                                                left: 12,
                                                bgcolor: 'rgba(15, 23, 42, 0.8)',
                                                color: '#E2E8F0',
                                                fontSize: '0.75rem',
                                                fontFamily: 'monospace',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em',
                                            }}
                                        />
                                    </Box>

                                    {/* Card Content */}
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {bike.category?.name || 'Two-Wheeler'} • {bike.transmission || 'Automatic'}
                                        </Typography>

                                        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 0.5, mb: 1 }}>
                                            {bike.brand} {bike.model_name}
                                        </Typography>

                                        {/* Hub Location */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                            <LocationOnIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                                                {bike.current_store?.name || 'Bengaluru Hub'}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 'auto', mb: 2 }} />

                                        {/* Pricing & CTA */}
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                                    Daily Rental
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                    ₹{Number(dailyRate).toLocaleString('en-IN')}{' '}
                                                    <Typography component="span" variant="caption" sx={{ color: '#64748B' }}>
                                                        / day
                                                    </Typography>
                                                </Typography>
                                            </Box>

                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                                    Refundable Deposit
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                                    ₹{Number(deposit).toLocaleString('en-IN')}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Button
                                            component={Link}
                                            href={detailUrl}
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            sx={{ mt: 'auto', fontWeight: 700 }}
                                        >
                                            Check Live Quote & Rent
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </AppLayout>
    );
}

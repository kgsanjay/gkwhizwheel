import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
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
    const { mode } = useColorMode();
    const isDark = mode === 'dark';
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
            <Head title="Browse Fleet - GK WhizWheels Honnavar" />

            <Box sx={{ maxWidth: '1410px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
                {/* Page Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                        Rental Bikes in Honnavar
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                        Select your pickup dates, preferred Honnavar hub (Palya Main Rd or Railway Station), or vehicle category.
                    </Typography>
                </Box>

            {/* Filter Panel */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 4,
                    bgcolor: isDark ? '#FFFFFF' : '#0F172A',
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
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            label="Pickup Hub"
                            value={filters.store_id}
                            onChange={(e) => handleFilterChange('store_id', e.target.value)}
                        >
                            <MenuItem value="">All Hubs (Honnavar)</MenuItem>
                            {stores.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                    {store.name} ({store.city})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Start Date */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                        bgcolor: isDark ? '#FFFFFF' : '#0F172A',
                    }}
                >
                    <TwoWheelerIcon sx={{ fontSize: 60, color: isDark ? '#94A3B8' : '#64748B', mb: 2 }} />
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
                        const weekdayRate = bike.weekday_rate || bike.daily_rate || bike.base_daily_rate_override || bike.category?.base_daily_rate || '350.00';
                        const weekendRate = bike.weekend_rate || (Number(weekdayRate) + (Number(weekdayRate) >= 1000 ? (Number(weekdayRate) >= 1200 ? 300 : 200) : (Number(weekdayRate) === 450 ? 50 : 100)));
                        const isElectric = bike.fuel_type === 'electric';

                        // Forward dates in query params to detail page if selected
                        const queryParams = new URLSearchParams();
                        if (filters.start_date) queryParams.set('start_date', filters.start_date);
                        if (filters.end_date) queryParams.set('end_date', filters.end_date);
                        if (filters.store_id) queryParams.set('pickup_store_id', filters.store_id);
                        const detailUrl = `/bikes/${bike.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bike.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                                        },
                                    }}
                                >
                                    {/* Bike Real Photo Header */}
                                    <Box
                                        sx={{
                                            height: 230,
                                            width: '100%',
                                            position: 'relative',
                                            bgcolor: '#DFE2E6',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 0,
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={bike.primary_image_url || (bike.primary_image_path ? (bike.primary_image_path.startsWith('http') ? bike.primary_image_path : `/storage/${bike.primary_image_path}`) : null) || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'}
                                            alt={`${bike.brand} ${bike.model_name}`}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center 75%',
                                                transition: 'transform 0.4s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.05)',
                                                },
                                            }}
                                        />

                                        {/* Electric or Fuel Badge */}
                                        <Chip
                                            icon={
                                                isElectric ? (
                                                    <ElectricBoltIcon sx={{ color: '#F59E0B !important' }} />
                                                ) : (
                                                    <LocalGasStationIcon sx={{ color: '#FFFFFF !important' }} />
                                                )
                                            }
                                            label={isElectric ? 'Electric EV' : 'Petrol'}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                backdropFilter: 'blur(8px)',
                                                color: isElectric ? '#F59E0B' : '#FFFFFF',
                                                fontWeight: 800,
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                                                bgcolor: 'rgba(15, 23, 42, 0.88)',
                                                backdropFilter: 'blur(8px)',
                                                color: '#E2E8F0',
                                                fontSize: '0.75rem',
                                                fontFamily: 'monospace',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                            }}
                                        />
                                    </Box>

                                    {/* Card Content */}
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {bike.category?.name || 'Two-Wheeler'} • {bike.transmission || 'Automatic'}
                                        </Typography>

                                        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 0.5, mb: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            {bike.brand} {bike.model_name}
                                        </Typography>

                                        {/* Hub Location */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                            <LocationOnIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#475569', fontWeight: 500 }}>
                                                {bike.current_store?.name || 'Honnavar Hub'}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 'auto', mb: 2 }} />

                                        {/* Pricing Box (Mon-Thu vs Fri-Sun) */}
                                        <Box sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', p: 1.5, borderRadius: 2, mb: 2, border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, fontSize: '0.82rem' }}>
                                                    Mon – Thu <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>(Weekday)</Box>
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
                                                    ₹{Number(weekdayRate).toLocaleString('en-IN')}{' '}
                                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                                        /day
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, fontSize: '0.82rem' }}>
                                                    Fri – Sun <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>(Weekend)</Box>
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#38BDF8' : '#0284C7', lineHeight: 1 }}>
                                                    ₹{Number(weekendRate).toLocaleString('en-IN')}{' '}
                                                    <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                                        /day
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <Divider sx={{ my: 0.8, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0' }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                                    ✓ Zero Deposit Option
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                                    Instant Pickup
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Button
                                            component={Link}
                                            href={detailUrl}
                                            variant="contained"
                                            color="secondary"
                                            fullWidth
                                            sx={{ mt: 'auto', fontWeight: 800, borderRadius: 2 }}
                                        >
                                            Book Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
            </Box>
        </AppLayout>
    );
}

import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useColorMode } from '../../../theme/ColorModeContext';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    TextField,
    MenuItem,
    Paper,
    Stack,
    Divider,
    IconButton,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    Tooltip,
    Alert,
    Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PeopleIcon from '@mui/icons-material/People';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import DirectionsIcon from '@mui/icons-material/Directions';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HubIcon from '@mui/icons-material/Hub';
import LayersIcon from '@mui/icons-material/Layers';

export default function StoresIndex({
    stores = [],
    stats = {},
    filters = {},
    cities = [],
}) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedCity, setSelectedCity] = useState(filters.city || '');
    const [viewMode, setViewMode] = useState('list');
    const [toastMessage, setToastMessage] = useState('');

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/stores',
            { search, status, city: selectedCity },
            { preserveState: true, replace: true }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setSelectedCity('');
        router.get('/admin/stores', {}, { preserveState: true, replace: true });
    };

    const handleToggleStatus = (store) => {
        router.post(`/admin/stores/${store.id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setToastMessage(`Store "${store.name}" status updated.`);
            },
        });
    };

    const ALL_SERVICES = [
        { slug: 'two_wheelers', label: 'Bike Rental', icon: '🏍️' },
        { slug: 'taxi', label: 'Cab Fleet', icon: '🚕' },
        { slug: 'homestay', label: 'Homestay', icon: '🏡' },
        { slug: 'rooms', label: 'Rooms', icon: '🛏️' },
        { slug: 'boating', label: 'Boating Safari', icon: '🚤' },
        { slug: 'scuba', label: 'Scuba Diving', icon: '🤿' },
        { slug: 'guide', label: 'Tour Guides', icon: '🧭' },
    ];

    const handleToggleService = (store, serviceSlug) => {
        const currentServices = store.services || [];
        const nextServices = currentServices.includes(serviceSlug)
            ? currentServices.filter((s) => s !== serviceSlug)
            : [...currentServices, serviceSlug];

        router.post(
            `/admin/stores/${store.id}/services`,
            { services: nextServices },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setToastMessage(`Updated services for "${store.name}".`);
                },
            }
        );
    };

    const getWhatsAppUrl = (phone, name) => {
        if (!phone) return null;
        const cleanPhone = phone.replace(/\D/g, '');
        const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const text = encodeURIComponent(`Hello ${name} Hub Team, operational dispatch message from GK WhizWheel Admin Console.`);
        return `https://wa.me/${targetPhone}?text=${text}`;
    };

    const getGoogleMapsUrl = (store) => {
        if (store.google_maps_url) return store.google_maps_url;
        if (store.latitude && store.longitude) {
            return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${store.city}, Karnataka`)}`;
    };

    return (
        <AdminLayout title="Store Hubs & Locations">
            <Head title="Store Hubs - Admin" />

            {/* Page Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    mb: 3.5,
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <StorefrontIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
                        >
                            Store Hubs & Physical Branches
                        </Typography>
                        <Chip
                            label={`${stats.active ?? 0} Online`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800, height: 24, fontSize: '0.72rem' }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Manage physical coastal operational centers, landmark pickup points, GPS dispatch coordinates, and branch service permissions.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button
                        component={Link}
                        href="/admin/pickup-points"
                        variant="outlined"
                        startIcon={<LocationOnIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: 'divider',
                            color: 'text.primary',
                        }}
                    >
                        Pickup Points
                    </Button>
                    <Button
                        component={Link}
                        href="/admin/stores/create"
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 2.5,
                            boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
                        }}
                    >
                        Add New Store Hub
                    </Button>
                </Stack>
            </Box>

            {/* Metrics Ribbon */}
            <Grid container spacing={2} sx={{ mb: 3.5 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                        sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                                >
                                    Total Hubs
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                                    {stats.total ?? 0}
                                </Typography>
                            </Box>
                            <HubIcon sx={{ color: 'primary.main', fontSize: 32, opacity: 0.8 }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                        sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="success.main"
                                    sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                                >
                                    Active & Online
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                                    {stats.active ?? 0}
                                </Typography>
                            </Box>
                            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32, opacity: 0.8 }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                        sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                                >
                                    Inactive Hubs
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.secondary' }}>
                                    {stats.inactive ?? 0}
                                </Typography>
                            </Box>
                            <StorefrontIcon sx={{ color: 'text.disabled', fontSize: 32 }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper
                        sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="primary.main"
                                    sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                                >
                                    Fleet Housed
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                                    {stats.total_bikes ?? 0}
                                </Typography>
                            </Box>
                            <TwoWheelerIcon sx={{ color: 'primary.main', fontSize: 32, opacity: 0.8 }} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Branch-Service Matrix Toggle Board */}
            <Paper
                sx={{
                    p: 2.5,
                    mb: 3.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LayersIcon fontSize="small" color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                Multi-Vertical Branch Service Matrix
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Live operational toggles gating public customer discovery and offline bookings per branch.
                        </Typography>
                    </Box>
                    <Chip
                        label="Changes save instantly"
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                    />
                </Box>

                <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, minWidth: 170 }}>Branch Hub</TableCell>
                                {ALL_SERVICES.map((srv) => (
                                    <TableCell key={srv.slug} align="center" sx={{ fontWeight: 800, minWidth: 110 }}>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                            <span>{srv.icon}</span>
                                            <span>{srv.label}</span>
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stores.map((store) => {
                                const storeServices = store.services || [];
                                return (
                                    <TableRow key={`matrix-${store.id}`} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {store.name}
                                            </Typography>
                                            <Chip
                                                label={store.city}
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.3 }}
                                            />
                                        </TableCell>
                                        {ALL_SERVICES.map((srv) => {
                                            const isEnabled = storeServices.includes(srv.slug);
                                            return (
                                                <TableCell key={`${store.id}-${srv.slug}`} align="center">
                                                    <Tooltip title={`${isEnabled ? 'Disable' : 'Enable'} ${srv.label} at ${store.name}`}>
                                                        <Switch
                                                            size="small"
                                                            checked={isEnabled}
                                                            onChange={() => handleToggleService(store, srv.slug)}
                                                            color="warning"
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Filters Bar */}
            <Paper
                component="form"
                onSubmit={handleSearchSubmit}
                sx={{
                    p: 2.2,
                    borderRadius: 3,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by hub name, city, or address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 6, md: 2.5 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Filter by City"
                            value={selectedCity}
                            onChange={(e) => {
                                setSelectedCity(e.target.value);
                                router.get(
                                    '/admin/stores',
                                    { search, status, city: e.target.value },
                                    { preserveState: true, replace: true }
                                );
                            }}
                        >
                            <MenuItem value="">All Cities</MenuItem>
                            {cities.map((c) => (
                                <MenuItem key={c} value={c}>
                                    {c}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2.5 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Hub Status"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get(
                                    '/admin/stores',
                                    { search, status: e.target.value, city: selectedCity },
                                    { preserveState: true, replace: true }
                                );
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="active">Active Only</MenuItem>
                            <MenuItem value="inactive">Inactive Only</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                        {(search || status || selectedCity) && (
                            <Tooltip title="Reset all search & filter parameters">
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    size="small"
                                    onClick={handleResetFilters}
                                    startIcon={<FilterAltOffIcon />}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Reset
                                </Button>
                            </Tooltip>
                        )}
                        <Button type="submit" variant="contained" size="small" sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Apply
                        </Button>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            size="small"
                            onChange={(_, val) => val && setViewMode(val)}
                        >
                            <ToggleButton value="list" aria-label="table view">
                                <ViewListIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="grid" aria-label="card view">
                                <ViewModuleIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>

            {/* Content: List or Grid */}
            {stores.length === 0 ? (
                <Paper
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <StorefrontIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        No store hubs match criteria
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Try clearing active filters or register a new store hub with GPS coordinates.
                    </Typography>
                    <Button
                        component={Link}
                        href="/admin/stores/create"
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                    >
                        Add New Store Hub
                    </Button>
                </Paper>
            ) : viewMode === 'list' ? (
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        overflowX: 'auto',
                    }}
                >
                    <Table sx={{ minWidth: 920 }}>
                        <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Store Hub</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Address & Maps</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Direct Contacts</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Fleet & Staff</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stores.map((store) => {
                                const waUrl = getWhatsAppUrl(store.phone, store.name);
                                const gmapsUrl = getGoogleMapsUrl(store);

                                return (
                                    <TableRow
                                        key={store.id}
                                        hover
                                        sx={{ opacity: store.status === 'active' ? 1 : 0.65 }}
                                    >
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                {store.name}
                                            </Typography>
                                            <Stack direction="row" spacing={0.8} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                                <Chip
                                                    label={store.city}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem' }}
                                                />
                                                {store.operating_hours_label && (
                                                    <Chip
                                                        icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                                                        label={store.operating_hours_label}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 260, color: 'text.secondary', fontSize: '0.84rem' }}>
                                                {store.address_line}, {store.city}, {store.state} - {store.pincode}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                <Button
                                                    component="a"
                                                    href={gmapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="small"
                                                    startIcon={<DirectionsIcon sx={{ fontSize: 14 }} />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontSize: '0.75rem',
                                                        py: 0.2,
                                                        px: 0.8,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Open Maps
                                                </Button>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', alignSelf: 'center' }}>
                                                    {store.latitude?.toFixed(4)}, {store.longitude?.toFixed(4)}
                                                </Typography>
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            {store.phone ? (
                                                <Stack spacing={0.8}>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                        {store.phone}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.8}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            component="a"
                                                            href={`tel:${store.phone}`}
                                                            startIcon={<PhoneIcon sx={{ fontSize: 13 }} />}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontSize: '0.72rem',
                                                                py: 0.2,
                                                                px: 0.8,
                                                                fontWeight: 700,
                                                                borderColor: 'divider',
                                                                color: 'text.primary',
                                                            }}
                                                        >
                                                            Call
                                                        </Button>
                                                        {waUrl && (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                component="a"
                                                                href={waUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                startIcon={<WhatsAppIcon sx={{ fontSize: 13 }} />}
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    fontSize: '0.72rem',
                                                                    py: 0.2,
                                                                    px: 0.8,
                                                                    fontWeight: 700,
                                                                    bgcolor: '#25D366',
                                                                    color: '#FFFFFF',
                                                                    '&:hover': { bgcolor: '#1EBE5D' },
                                                                }}
                                                            >
                                                                WhatsApp
                                                            </Button>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Stack spacing={0.6}>
                                                <Chip
                                                    component={Link}
                                                    href={`/admin/bikes?store_id=${store.id}`}
                                                    clickable
                                                    icon={<TwoWheelerIcon sx={{ fontSize: 14 }} />}
                                                    label={`${store.current_bikes_count ?? store.home_bikes_count ?? 0} Bikes Housed`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.72rem',
                                                        justifyContent: 'flex-start',
                                                        bgcolor: isDark ? 'rgba(25, 118, 210, 0.15)' : '#EFF6FF',
                                                        color: 'primary.main',
                                                    }}
                                                />
                                                <Chip
                                                    component={Link}
                                                    href={`/admin/staff?store_id=${store.id}`}
                                                    clickable
                                                    icon={<PeopleIcon sx={{ fontSize: 14 }} />}
                                                    label={`${store.staff_count ?? 0} Staff Assigned`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '0.72rem',
                                                        justifyContent: 'flex-start',
                                                    }}
                                                />
                                                <Chip
                                                    component={Link}
                                                    href={`/admin/pickup-points?store_id=${store.id}`}
                                                    clickable
                                                    icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                                                    label="Pickup Points"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '0.72rem',
                                                        justifyContent: 'flex-start',
                                                    }}
                                                />
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Tooltip title={`Toggle ${store.status === 'active' ? 'Inactive' : 'Active'}`}>
                                                <Switch
                                                    size="small"
                                                    checked={store.status === 'active'}
                                                    onChange={() => handleToggleStatus(store)}
                                                    color="success"
                                                />
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button
                                                    component={Link}
                                                    href={`/admin/stores/${store.id}/edit`}
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Grid container spacing={2.5}>
                    {stores.map((store) => {
                        const waUrl = getWhatsAppUrl(store.phone, store.name);
                        const gmapsUrl = getGoogleMapsUrl(store);
                        const activeServices = store.services || [];

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={store.id}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                        opacity: store.status === 'active' ? 1 : 0.72,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                    {store.name}
                                                </Typography>
                                                <Stack direction="row" spacing={0.8} sx={{ mt: 0.5 }}>
                                                    <Chip
                                                        label={store.city}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                                    />
                                                    {store.operating_hours_label && (
                                                        <Chip
                                                            label={store.operating_hours_label}
                                                            size="small"
                                                            sx={{ fontSize: '0.7rem', height: 22 }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                            <Tooltip title={`Toggle ${store.status === 'active' ? 'Inactive' : 'Active'}`}>
                                                <Switch
                                                    size="small"
                                                    checked={store.status === 'active'}
                                                    onChange={() => handleToggleStatus(store)}
                                                    color="success"
                                                />
                                            </Tooltip>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ my: 1.5, minHeight: 38, fontSize: '0.84rem' }}>
                                            {store.address_line}, {store.city}, {store.state} - {store.pincode}
                                        </Typography>

                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                mb: 2,
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                    <PlaceIcon fontSize="small" color="primary" />
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                        {store.latitude?.toFixed(4)}, {store.longitude?.toFixed(4)}
                                                    </Typography>
                                                </Stack>
                                                <Button
                                                    component="a"
                                                    href={gmapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="small"
                                                    endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                    sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.1, px: 0.6 }}
                                                >
                                                    Map
                                                </Button>
                                            </Stack>

                                            {store.phone && (
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.2 }}>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                        {store.phone}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.6}>
                                                        <IconButton
                                                            component="a"
                                                            href={`tel:${store.phone}`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            <PhoneIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                        {waUrl && (
                                                            <IconButton
                                                                component="a"
                                                                href={waUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                size="small"
                                                                sx={{ p: 0.5, color: '#25D366' }}
                                                            >
                                                                <WhatsAppIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            )}
                                        </Paper>

                                        {/* Fleet & Services Badges */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 0.8, display: 'block' }}>
                                                Active Services ({activeServices.length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                                {activeServices.map((slug) => {
                                                    const srv = ALL_SERVICES.find((s) => s.slug === slug);
                                                    return (
                                                        <Chip
                                                            key={slug}
                                                            label={`${srv?.icon || '•'} ${srv?.label || slug}`}
                                                            size="small"
                                                            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 'auto' }}>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                                <Chip
                                                    component={Link}
                                                    href={`/admin/bikes?store_id=${store.id}`}
                                                    clickable
                                                    icon={<TwoWheelerIcon sx={{ fontSize: 13 }} />}
                                                    label={`${store.current_bikes_count ?? store.home_bikes_count ?? 0} Bikes`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                                />
                                                <Chip
                                                    component={Link}
                                                    href={`/admin/pickup-points?store_id=${store.id}`}
                                                    clickable
                                                    icon={<LocationOnIcon sx={{ fontSize: 13 }} />}
                                                    label="Points"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                                />
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    {store.staff_count ?? 0} staff
                                                </Typography>
                                            </Stack>

                                            <Button
                                                component={Link}
                                                href={`/admin/stores/${store.id}/edit`}
                                                fullWidth
                                                variant="contained"
                                                size="small"
                                                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Edit Store Hub
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Notification Toast */}
            <Snackbar
                open={Boolean(toastMessage)}
                autoHideDuration={3000}
                onClose={() => setToastMessage('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setToastMessage('')} sx={{ fontWeight: 600 }}>
                    {toastMessage}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
}

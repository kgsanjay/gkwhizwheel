import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PeopleIcon from '@mui/icons-material/People';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

export default function StoresIndex({
    stores = [],
    stats = {},
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [viewMode, setViewMode] = useState('list');

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/stores',
            { search, status },
            { preserveState: true, replace: true }
        );
    };

    const handleToggleStatus = (store) => {
        router.post(`/admin/stores/${store.id}/toggle`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Store Hubs & Locations">
            <Head title="Store Hubs - Admin" />

            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Store Hubs & Pickup Locations
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Manage physical rental hubs, GPS coordinates for customer pickup/return, and assigned fleet staff.
                    </Typography>
                </Box>
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
                        py: 1,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                    }}
                >
                    Add Store Hub
                </Button>
            </Box>

            {/* Metrics Strip */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Total Hubs
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {stats.total ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Active Hubs
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                            {stats.active ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Inactive Hubs
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'text.secondary' }}>
                            {stats.inactive ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Fleet Housed
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                            {stats.total_bikes ?? 0} Bikes
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filters Bar */}
            <Paper component="form" onSubmit={handleSearchSubmit} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by hub name, city, or address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Hub Status"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get('/admin/stores', { search, status: e.target.value }, { preserveState: true, replace: true });
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="active">Active Hubs Only</MenuItem>
                            <MenuItem value="inactive">Inactive Hubs Only</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5 }}>
                        <Button type="submit" variant="outlined" sx={{ textTransform: 'none' }}>
                            Filter
                        </Button>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            size="small"
                            onChange={(_, val) => val && setViewMode(val)}
                        >
                            <ToggleButton value="list">
                                <ViewListIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="grid">
                                <ViewModuleIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>

            {/* Content: List or Grid */}
            {stores.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <StorefrontIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        No store hubs found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Try clearing search filters or create a new pickup location with the map picker.
                    </Typography>
                    <Button component={Link} href="/admin/stores/create" variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Add First Store Hub
                    </Button>
                </Paper>
            ) : viewMode === 'list' ? (
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Store Hub Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Address & Location</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>GPS Coordinates</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact Phone</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Assigned Staff</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stores.map((store) => (
                                <TableRow key={store.id} hover sx={{ opacity: store.status === 'active' ? 1 : 0.65 }}>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {store.name}
                                        </Typography>
                                        <Chip label={store.city} size="small" sx={{ mt: 0.5, fontWeight: 600, fontSize: '0.75rem' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 220 }}>
                                            {store.address_line}, {store.city}, {store.state} - {store.pincode}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <PlaceIcon fontSize="small" color="primary" />
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                                                {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        {store.phone ? (
                                            <Typography variant="body2">{store.phone}</Typography>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <PeopleIcon fontSize="small" color="action" />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {store.staff_count} staff
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            size="small"
                                            checked={store.status === 'active'}
                                            onChange={() => handleToggleStatus(store)}
                                            color="success"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            component={Link}
                                            href={`/admin/stores/${store.id}/edit`}
                                            size="small"
                                            startIcon={<EditIcon fontSize="small" />}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Grid container spacing={2.5}>
                    {stores.map((store) => (
                        <Grid item xs={12} sm={6} md={4} key={store.id}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', opacity: store.status === 'active' ? 1 : 0.7 }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                            {store.name}
                                        </Typography>
                                        <Switch
                                            size="small"
                                            checked={store.status === 'active'}
                                            onChange={() => handleToggleStatus(store)}
                                            color="success"
                                        />
                                    </Box>

                                    <Chip label={store.city} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, mb: 2 }} />

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                        {store.address_line}, {store.city}, {store.state} - {store.pincode}
                                    </Typography>

                                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                            <PlaceIcon fontSize="small" color="primary" />
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                {store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}
                                            </Typography>
                                        </Stack>
                                        {store.phone && (
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <PhoneIcon fontSize="small" color="action" />
                                                <Typography variant="caption">{store.phone}</Typography>
                                            </Stack>
                                        )}
                                    </Box>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {store.staff_count} staff assigned
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {store.home_bikes_count || 0} home bikes
                                        </Typography>
                                    </Stack>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            component={Link}
                                            href={`/admin/stores/${store.id}/edit`}
                                            size="small"
                                            startIcon={<EditIcon fontSize="small" />}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Edit Store Hub
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </AdminLayout>
    );
}

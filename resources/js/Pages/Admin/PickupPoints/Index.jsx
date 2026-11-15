import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import MapPicker from '../../../Components/MapPicker';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import StoreIcon from '@mui/icons-material/Store';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import CloseIcon from '@mui/icons-material/Close';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import LocationCityIcon from '@mui/icons-material/LocationCity';

const BLANK_FORM = {
    store_id: '',
    name: '',
    address_line: '',
    landmark: '',
    latitude: '',
    longitude: '',
    delivery_fee: '0',
    pickup_fee: '',
    return_fee: '',
    supports_pickup: true,
    supports_return: true,
    sort_order: 0,
};

export default function PickupPointsIndex({ stores = [], points = [] }) {
    const [form, setForm] = useState(BLANK_FORM);
    const [editingId, setEditingId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Filter states
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Delete confirmation dialog state
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));

    // When branch changes in modal, auto-center map on that branch hub if coordinates are blank
    const handleBranchChange = (newStoreId) => {
        set('store_id', newStoreId);
        const store = stores.find((s) => String(s.id) === String(newStoreId));
        if (store && (!form.latitude || !form.longitude)) {
            setForm((prev) => ({
                ...prev,
                store_id: newStoreId,
                latitude: store.latitude ?? prev.latitude,
                longitude: store.longitude ?? prev.longitude,
            }));
        }
    };

    const handleMapChange = ({ latitude, longitude }) => {
        setForm((prev) => ({
            ...prev,
            latitude,
            longitude,
        }));
    };

    const handleOpenCreate = () => {
        const defaultStore = stores[0];
        setEditingId(null);
        setForm({
            ...BLANK_FORM,
            store_id: defaultStore ? defaultStore.id : '',
            latitude: defaultStore?.latitude ?? 14.2802,
            longitude: defaultStore?.longitude ?? 74.4439,
        });
        setErrors({});
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (point) => {
        setEditingId(point.id);
        setForm({
            store_id: point.store_id,
            name: point.name,
            address_line: point.address_line || '',
            landmark: point.landmark || '',
            latitude: point.latitude ?? '',
            longitude: point.longitude ?? '',
            delivery_fee: point.delivery_fee ?? '0',
            pickup_fee: point.pickup_fee ?? '',
            return_fee: point.return_fee ?? '',
            supports_pickup: Boolean(point.supports_pickup),
            supports_return: Boolean(point.supports_return),
            sort_order: point.sort_order ?? 0,
        });
        setErrors({});
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        setForm(BLANK_FORM);
        setErrors({});
    };

    const handleSave = (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);

        const payload = {
            ...form,
            pickup_fee: form.pickup_fee === '' ? null : Number(form.pickup_fee),
            return_fee: form.return_fee === '' ? null : Number(form.return_fee),
            latitude: form.latitude === '' ? null : Number(form.latitude),
            longitude: form.longitude === '' ? null : Number(form.longitude),
        };

        const url = editingId ? `/admin/pickup-points/${editingId}` : '/admin/pickup-points';

        router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseDialog();
            },
            onError: setErrors,
            onFinish: () => setSaving(false),
        });
    };

    const handleToggle = (pointId) => {
        router.post(`/admin/pickup-points/${pointId}/toggle`, {}, { preserveScroll: true });
    };

    const handleDelete = (pointId) => {
        router.delete(`/admin/pickup-points/${pointId}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirmId(null),
        });
    };

    // Filtered points calculation
    const filteredPoints = useMemo(() => {
        return points.filter((p) => {
            // Branch filter
            if (selectedBranchFilter !== 'all' && String(p.store_id) !== String(selectedBranchFilter)) {
                return false;
            }
            // Status filter
            if (statusFilter === 'published' && !p.is_active) return false;
            if (statusFilter === 'draft' && p.is_active) return false;
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const name = (p.name || '').toLowerCase();
                const address = (p.address_line || '').toLowerCase();
                const landmark = (p.landmark || '').toLowerCase();
                const branch = (p.store?.name || p.store?.city || '').toLowerCase();
                if (!name.includes(q) && !address.includes(q) && !landmark.includes(q) && !branch.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [points, selectedBranchFilter, statusFilter, searchQuery]);

    // Summary counts
    const totalCount = points.length;
    const publishedCount = points.filter((p) => p.is_active).length;
    const draftCount = points.filter((p) => !p.is_active).length;
    const activeBranchesCovered = new Set(points.map((p) => p.store_id)).size;

    return (
        <AdminLayout title="Pickup & Return Meeting Points">
            <Head title="Pickup Points | G.K. WhizWheel Admin" />

            <Stack spacing={3}>
                {/* Header & Metric Summary */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            Pickup &amp; Return Meeting Points
                        </Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                            Configure physical railway stations, bus stands, beaches, ports, and resort meeting points across operational hubs.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                        disabled={stores.length === 0}
                        sx={{
                            fontWeight: 800,
                            textTransform: 'none',
                            borderRadius: 2.5,
                            px: 3,
                            py: 1,
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                        }}
                    >
                        Add New Pickup Point
                    </Button>
                </Box>

                {/* Key Metric Cards */}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                Total Points
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                                {totalCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, textTransform: 'uppercase' }}>
                                Published &amp; Active
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>
                                {publishedCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, textTransform: 'uppercase' }}>
                                Drafts / Hidden
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: 'warning.main', mt: 0.5 }}>
                                {draftCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase' }}>
                                Active Hubs Covered
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
                                {activeBranchesCovered} / {stores.length}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Search & Filter Toolbar */}
                <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search by point name, landmark, address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3, md: 3.5 }}>
                            <TextField
                                select
                                size="small"
                                fullWidth
                                label="Filter by Branch"
                                value={selectedBranchFilter}
                                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                                sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="all">All Operating Branches</MenuItem>
                                {stores.map((s) => (
                                    <MenuItem key={s.id} value={String(s.id)}>
                                        {s.name} ({s.city})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3, md: 3.5 }}>
                            <TextField
                                select
                                size="small"
                                fullWidth
                                label="Publication Status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="published">Published Only</MenuItem>
                                <MenuItem value="draft">Drafts Only</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Pickup Points Table */}
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table sx={{ minWidth: 700 }}>
                                <TableHead sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Branch Hub</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Pickup / Meeting Point</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Google Maps GPS</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Pickup Fee</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Return Fee</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Service Allowed</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPoints.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                                <PlaceIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    No pickup points found
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {searchQuery || selectedBranchFilter !== 'all' || statusFilter !== 'all'
                                                        ? 'Try clearing your filters or search keywords.'
                                                        : 'Click "Add New Pickup Point" above to create meeting locations for customers.'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPoints.map((point) => {
                                            const hasCoords = point.latitude && point.longitude;
                                            const gmapsUrl = hasCoords ? `https://www.google.com/maps?q=${point.latitude},${point.longitude}` : null;

                                            return (
                                                <TableRow key={point.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                    {/* Branch */}
                                                    <TableCell>
                                                        <Chip
                                                            icon={<StoreIcon sx={{ fontSize: '14px !important', color: '#B45309 !important' }} />}
                                                            label={point.store?.city || point.store?.name || 'Branch'}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.75rem',
                                                                bgcolor: '#FEF3C7',
                                                                color: '#92400E',
                                                                border: '1px solid #FDE68A',
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Location Details */}
                                                    <TableCell>
                                                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.3 }}>
                                                            {point.name}
                                                        </Typography>
                                                        {point.landmark && (
                                                            <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, display: 'block', mt: 0.2 }}>
                                                                📍 {point.landmark}
                                                            </Typography>
                                                        )}
                                                        {point.address_line && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', maxWidth: 260 }}>
                                                                {point.address_line}
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Google Maps Coordinates */}
                                                    <TableCell>
                                                        {hasCoords ? (
                                                            <Tooltip title="View exact pin on Google Maps">
                                                                <Button
                                                                    component="a"
                                                                    href={gmapsUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    size="small"
                                                                    startIcon={<PlaceIcon sx={{ fontSize: 15, color: '#EA4335' }} />}
                                                                    endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontSize: '0.74rem',
                                                                        fontWeight: 700,
                                                                        py: 0.2,
                                                                        px: 1,
                                                                        borderRadius: 1.5,
                                                                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(234, 67, 53, 0.1)' : '#FEF2F2',
                                                                        color: '#DC2626',
                                                                    }}
                                                                >
                                                                    {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                                                                </Button>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Coordinates not set
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Pickup Fee */}
                                                    <TableCell>
                                                        {point.pickup_fee == null ? (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Not set
                                                            </Typography>
                                                        ) : Number(point.pickup_fee) === 0 ? (
                                                            <Chip label="Free Pickup" size="small" color="success" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }} />
                                                        ) : (
                                                            <Typography variant="body2" fontWeight={800}>
                                                                ₹{Number(point.pickup_fee).toLocaleString('en-IN')}
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Return Fee */}
                                                    <TableCell>
                                                        {point.return_fee == null ? (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Not set
                                                            </Typography>
                                                        ) : Number(point.return_fee) === 0 ? (
                                                            <Chip label="Free Return" size="small" color="success" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }} />
                                                        ) : (
                                                            <Typography variant="body2" fontWeight={800}>
                                                                ₹{Number(point.return_fee).toLocaleString('en-IN')}
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Service Allowed */}
                                                    <TableCell>
                                                        <Stack direction="row" spacing={0.5}>
                                                            {point.supports_pickup && (
                                                                <Chip label="Pickup" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'primary.50', color: 'primary.main' }} />
                                                            )}
                                                            {point.supports_return && (
                                                                <Chip label="Return" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'secondary.50', color: 'secondary.main' }} />
                                                            )}
                                                        </Stack>
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            icon={point.is_active ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : <PauseCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                            label={point.is_active ? 'Published' : 'Draft'}
                                                            color={point.is_active ? 'success' : 'default'}
                                                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                                                        />
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                                                                onClick={() => handleOpenEdit(point)}
                                                                sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.78rem', py: 0.3, px: 1.2 }}
                                                            >
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color={point.is_active ? 'warning' : 'success'}
                                                                onClick={() => handleToggle(point.id)}
                                                                sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.78rem', py: 0.3, px: 1.2 }}
                                                            >
                                                                {point.is_active ? 'Unpublish' : 'Publish'}
                                                            </Button>

                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => setDeleteConfirmId(point.id)}
                                                                sx={{ p: 0.6 }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Stack>

            {/* Add / Edit Pickup Point Modal Dialog with Google Maps */}
            <Dialog
                open={isDialogOpen}
                onClose={handleCloseDialog}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, p: { xs: 1, sm: 2 }, overflowX: 'hidden' },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            {editingId ? 'Edit Pickup & Return Point' : 'Create New Pickup Point'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Pin exact meeting spot coordinates on Google Maps and set branch pricing rules.
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseDialog} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />

                <Box component="form" onSubmit={handleSave}>
                    <DialogContent sx={{ pt: 2.5, overflowX: 'hidden' }}>
                        <Grid container spacing={3} disableEqualOverflow>
                            {/* Left Column: Point Fields & Tariffs */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Stack spacing={2.5}>
                                    {/* Branch selector */}
                                    <TextField
                                        select
                                        required
                                        fullWidth
                                        label="Operating Branch Hub"
                                        value={form.store_id}
                                        onChange={(e) => handleBranchChange(e.target.value)}
                                        error={Boolean(errors.store_id)}
                                        helperText={errors.store_id || 'Select the physical hub that manages this location'}
                                    >
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.name} ({s.city})
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {/* Name */}
                                    <TextField
                                        required
                                        fullWidth
                                        label="Pickup Point Name"
                                        placeholder="e.g. Honnavar Railway Station (Gate 1)"
                                        value={form.name}
                                        onChange={(e) => set('name', e.target.value)}
                                        error={Boolean(errors.name)}
                                        helperText={errors.name}
                                    />

                                    {/* Landmark */}
                                    <TextField
                                        fullWidth
                                        label="Landmark & Meeting Instructions"
                                        placeholder="e.g. In front of Indian Oil pump / Main Entrance parking lot"
                                        value={form.landmark}
                                        onChange={(e) => set('landmark', e.target.value)}
                                        error={Boolean(errors.landmark)}
                                        helperText={errors.landmark || 'Specific meeting spot guidance given to tourists on WhatsApp'}
                                    />

                                    {/* Address Line */}
                                    <TextField
                                        fullWidth
                                        label="Full Street Address"
                                        placeholder="e.g. Station Rd, Honnavar, Karnataka 581334"
                                        value={form.address_line}
                                        onChange={(e) => set('address_line', e.target.value)}
                                        error={Boolean(errors.address_line)}
                                        helperText={errors.address_line}
                                    />

                                    {/* Pricing & Fees */}
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <CurrencyRupeeIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                                            Location Tariffs &amp; Delivery Fees
                                        </Typography>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Pickup Charge (₹)"
                                                    value={form.pickup_fee}
                                                    onChange={(e) => set('pickup_fee', e.target.value)}
                                                    helperText="Enter 0 for Free pickup, or leave empty if unset."
                                                    error={Boolean(errors.pickup_fee)}
                                                    inputProps={{ min: 0, step: '1' }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Return Charge (₹)"
                                                    value={form.return_fee}
                                                    onChange={(e) => set('return_fee', e.target.value)}
                                                    helperText="Different from pickup if long-distance return."
                                                    error={Boolean(errors.return_fee)}
                                                    inputProps={{ min: 0, step: '1' }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Service Toggle Switches */}
                                    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                            Operational Permissions
                                        </Typography>
                                        <Stack direction="row" spacing={3}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={form.supports_pickup}
                                                        onChange={(e) => set('supports_pickup', e.target.checked)}
                                                        color="primary"
                                                    />
                                                }
                                                label={<Typography variant="body2" fontWeight={600}>Allow Pickups</Typography>}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={form.supports_return}
                                                        onChange={(e) => set('supports_return', e.target.checked)}
                                                        color="secondary"
                                                    />
                                                }
                                                label={<Typography variant="body2" fontWeight={600}>Allow Returns</Typography>}
                                            />
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Grid>

                            {/* Right Column: Google Maps Interactive GPS Picker */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <PlaceIcon sx={{ color: '#EA4335' }} />
                                        <Typography variant="subtitle1" fontWeight={800}>
                                            Google Maps Pinpoint
                                        </Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                                        Search the exact station/spot or drag the pin. Tourists receive this exact coordinate link on WhatsApp upon booking.
                                    </Typography>

                                    {/* Interactive Google Map */}
                                    <Box sx={{ flexGrow: 1, minHeight: 320 }}>
                                        <MapPicker
                                            latitude={form.latitude}
                                            longitude={form.longitude}
                                            onChange={handleMapChange}
                                            height="320px"
                                        />
                                    </Box>

                                    {/* Coordinates Manual Sync */}
                                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                label="Latitude"
                                                value={form.latitude}
                                                onChange={(e) => set('latitude', e.target.value)}
                                                error={Boolean(errors.latitude)}
                                                helperText={errors.latitude}
                                                inputProps={{ step: '0.000001' }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                label="Longitude"
                                                value={form.longitude}
                                                onChange={(e) => set('longitude', e.target.value)}
                                                error={Boolean(errors.longitude)}
                                                helperText={errors.longitude}
                                                inputProps={{ step: '0.000001' }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Error Alert */}
                        {Object.keys(errors).length > 0 && (
                            <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2 }}>
                                Please correct the highlighted errors before saving.
                            </Alert>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={saving || !form.store_id || !form.name}
                            sx={{ fontWeight: 800, textTransform: 'none', px: 3, borderRadius: 2 }}
                        >
                            {saving ? 'Saving...' : editingId ? 'Update Pickup Point' : 'Save as Draft'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog
                open={Boolean(deleteConfirmId)}
                onClose={() => setDeleteConfirmId(null)}
                maxWidth="xs"
                PaperProps={{
                    sx: { borderRadius: 3, overflowX: 'hidden' },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Delete Pickup Point?</DialogTitle>
                <DialogContent sx={{ overflowX: 'hidden' }}>
                    <Typography variant="body2">
                        Are you sure you want to permanently remove this pickup point? Customers will no longer be able to select it during checkout.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirmId(null)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDelete(deleteConfirmId)}
                        sx={{ fontWeight: 800, textTransform: 'none' }}
                    >
                        Delete Point
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

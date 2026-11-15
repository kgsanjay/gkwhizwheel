import React, { useMemo, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useTheme } from '@mui/material/styles';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    CircularProgress,
    Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CategoryIcon from '@mui/icons-material/Category';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import StoreIcon from '@mui/icons-material/Store';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import PlaceIcon from '@mui/icons-material/Place';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';

export default function BikeModelsIndex({
    models = [],
    categories = [],
    stores = [],
    unlinked_units = 0,
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // View & Filter States
    const [viewMode, setViewMode] = useState('list');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedFuel, setSelectedFuel] = useState('all');
    const [selectedTransmission, setSelectedTransmission] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [expanded, setExpanded] = useState(null);

    // Create Modal State
    const [createOpen, setCreateOpen] = useState(false);
    const createForm = useForm({
        category_id: '',
        brand: '',
        name: '',
        fuel_type: 'petrol',
        transmission: 'automatic',
        description: '',
    });

    // Edit Modal State
    const [editOpen, setEditOpen] = useState(false);
    const [editingModel, setEditingModel] = useState(null);
    const editForm = useForm({
        category_id: '',
        brand: '',
        name: '',
        fuel_type: 'petrol',
        transmission: 'automatic',
        description: '',
        is_active: true,
    });

    // Bulk Register Modal State
    const [bulkModel, setBulkModel] = useState(null);
    const [bulkStore, setBulkStore] = useState('');
    const [bulkRows, setBulkRows] = useState([{ registration_number: '', odometer_reading: 0 }]);
    const [bulkErrors, setBulkErrors] = useState({});
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Branch Dynamic Rates State
    const [rateEdits, setRateEdits] = useState({});
    const [savingRateKey, setSavingRateKey] = useState(null);

    const rateKey = (modelId, storeId) => `${modelId}-${storeId}`;

    const editRates = (model, store) => {
        const key = rateKey(model.id, store.id);
        const configured = (model.branch_prices || []).find((rate) => Number(rate.store_id) === Number(store.id));
        return (
            rateEdits[key] || {
                weekday_rate: configured?.weekday_rate ?? '',
                weekend_rate: configured?.weekend_rate ?? '',
            }
        );
    };

    const handleSaveRates = (event, model, store) => {
        event.preventDefault();
        const key = rateKey(model.id, store.id);
        if (savingRateKey) return;
        setSavingRateKey(key);

        router.post(
            `/admin/bike-models/${model.id}/branch-prices`,
            {
                store_id: store.id,
                ...editRates(model, store),
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingRateKey(null),
            }
        );
    };

    const handleToggleActive = (model) => {
        router.post(`/admin/bike-models/${model.id}/toggle-active`, {}, { preserveScroll: true });
    };

    const startEdit = (model) => {
        setEditingModel(model);
        editForm.setData({
            category_id: model.category_id || '',
            brand: model.brand || '',
            name: model.name || '',
            fuel_type: model.fuel_type || 'petrol',
            transmission: model.transmission || 'automatic',
            description: model.description || '',
            is_active: Boolean(model.is_active),
        });
        editForm.clearErrors();
        setEditOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingModel) return;
        editForm.put(`/admin/bike-models/${editingModel.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setEditingModel(null);
            },
        });
    };

    const startBulk = (model) => {
        setBulkModel(model);
        setBulkStore(stores.find((store) => store.id)?.id || '');
        setBulkRows([{ registration_number: '', odometer_reading: 0 }]);
        setBulkErrors({});
    };

    const changeRow = (index, key, value) => {
        setBulkRows((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
    };

    const submitBulk = (event) => {
        event.preventDefault();
        if (!bulkModel || !bulkStore || bulkProcessing || bulkRows.length === 0) return;
        setBulkErrors({});
        setBulkProcessing(true);
        router.post(
            `/admin/bike-models/${bulkModel.id}/bikes/bulk`,
            {
                store_id: bulkStore,
                bikes: bulkRows.map((row) => ({
                    registration_number: row.registration_number.trim().toUpperCase(),
                    odometer_reading: row.odometer_reading === '' ? 0 : Number(row.odometer_reading),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => setBulkModel(null),
                onError: setBulkErrors,
                onFinish: () => setBulkProcessing(false),
            }
        );
    };

    const handleCreateSubmit = (event) => {
        event.preventDefault();
        createForm.post('/admin/bike-models', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    // Filter Logic
    const hasActiveFilters =
        Boolean(search) ||
        selectedCategory !== 'all' ||
        selectedBranch !== 'all' ||
        selectedFuel !== 'all' ||
        selectedTransmission !== 'all' ||
        selectedStatus !== 'all';

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedBranch('all');
        setSelectedFuel('all');
        setSelectedTransmission('all');
        setSelectedStatus('all');
    };

    const filteredModels = useMemo(() => {
        return models.filter((model) => {
            if (selectedCategory !== 'all' && String(model.category_id) !== String(selectedCategory)) {
                return false;
            }
            if (selectedFuel !== 'all' && model.fuel_type !== selectedFuel) {
                return false;
            }
            if (selectedTransmission !== 'all' && model.transmission !== selectedTransmission) {
                return false;
            }
            if (selectedStatus === 'active' && !model.is_active) {
                return false;
            }
            if (selectedStatus === 'inactive' && model.is_active) {
                return false;
            }
            if (selectedBranch !== 'all') {
                const hasUnits = (model.branches || []).some(
                    (b) => String(b.store_id) === String(selectedBranch) && b.total_units > 0
                );
                if (!hasUnits) return false;
            }
            if (search.trim()) {
                const term = search.toLowerCase();
                const matchesModel = `${model.brand} ${model.name} ${model.category_name || ''} ${model.description || ''}`
                    .toLowerCase()
                    .includes(term);
                const matchesBike = (model.units || []).some((u) =>
                    u.registration_number.toLowerCase().includes(term)
                );
                if (!matchesModel && !matchesBike) return false;
            }
            return true;
        });
    }, [models, search, selectedCategory, selectedBranch, selectedFuel, selectedTransmission, selectedStatus]);

    // KPI Metrics
    const totalModels = models.length;
    const activeModels = models.filter((m) => m.is_active).length;
    const totalLinkedBikes = models.reduce((sum, m) => sum + (m.total_units || 0), 0);
    const totalAvailableNow = models.reduce(
        (sum, m) => sum + (m.branches || []).reduce((bSum, b) => bSum + (b.available_now || 0), 0),
        0
    );

    const storeName = (id) => stores.find((store) => Number(store.id) === Number(id))?.name || `Branch #${id}`;

    return (
        <AdminLayout title="Bike Model Catalog">
            <Head title="Bike Models - GK WhizWheel Admin" />

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header Strip */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        mb: 3,
                    }}
                >
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                                sx={{
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                    color: 'warning.main',
                                    p: 1,
                                    borderRadius: 2,
                                    display: 'flex',
                                }}
                            >
                                <CategoryIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                                        Bike Model Catalog
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label="Fleet Hierarchy"
                                        color="warning"
                                        variant="outlined"
                                        sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                                    />
                                </Stack>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
                                    Standardized specifications and branch-specific daily pricing matrices mapped to individual physical vehicles.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                            component={Link}
                            href="/admin/bikes"
                            variant="outlined"
                            size="medium"
                            startIcon={<TwoWheelerIcon />}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 700,
                                borderColor: 'divider',
                                color: 'text.primary',
                                flex: { xs: 1, sm: 'none' },
                            }}
                        >
                            Physical Fleet
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="medium"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                createForm.clearErrors();
                                setCreateOpen(true);
                            }}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 800,
                                px: 2.5,
                                bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                color: isDark ? '#0F172A' : '#FFFFFF',
                                boxShadow: 'none',
                                flex: { xs: 1, sm: 'none' },
                                '&:hover': {
                                    bgcolor: isDark ? '#D97706' : '#1E293B',
                                },
                            }}
                        >
                            Add Bike Model
                        </Button>
                    </Stack>
                </Box>

                {/* Operations KPI Metrics Strip */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Catalog Models
                                </Typography>
                                <CategoryIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'text.primary' }}>
                                {totalModels}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {activeModels} active · {totalModels - activeModels} draft
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Linked Fleet
                                </Typography>
                                <TwoWheelerIcon sx={{ fontSize: 18, color: 'info.main' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'text.primary' }}>
                                {totalLinkedBikes}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Physical units across all hubs
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Available Now
                                </Typography>
                                <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>
                                {totalAvailableNow}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {totalLinkedBikes > 0 ? Math.round((totalAvailableNow / totalLinkedBikes) * 100) : 0}% fleet ready to book
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: unlinked_units > 0 ? 'warning.main' : 'divider',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Unlinked Units
                                </Typography>
                                <WarningAmberIcon sx={{ fontSize: 18, color: unlinked_units > 0 ? 'warning.main' : 'text.disabled' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: unlinked_units > 0 ? 'warning.main' : 'text.primary' }}>
                                {unlinked_units}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {unlinked_units > 0 ? 'Legacy bikes needing model link' : 'All physical bikes cataloged'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {unlinked_units > 0 && (
                    <Alert
                        severity="warning"
                        action={
                            <Button component={Link} href="/admin/bikes" color="inherit" size="small" sx={{ fontWeight: 800 }}>
                                View Unlinked Bikes
                            </Button>
                        }
                        sx={{ mb: 3, borderRadius: 2 }}
                    >
                        <strong>{unlinked_units} registered vehicle(s)</strong> are not yet associated with a catalog model. You can edit individual vehicles to map them to these models.
                    </Alert>
                )}

                {/* Filter and Search Bar */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                    }}
                >
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, md: 3.5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by model, brand, or reg no..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                {categories.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Branch Presence"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                            >
                                <MenuItem value="all">All Operational Hubs</MenuItem>
                                {stores.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name} ({s.city})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Fuel"
                                value={selectedFuel}
                                onChange={(e) => setSelectedFuel(e.target.value)}
                            >
                                <MenuItem value="all">All Fuels</MenuItem>
                                <MenuItem value="petrol">Petrol</MenuItem>
                                <MenuItem value="electric">Electric</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Transmission"
                                value={selectedTransmission}
                                onChange={(e) => setSelectedTransmission(e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="automatic">Automatic</MenuItem>
                                <MenuItem value="manual">Manual</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.5 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <ToggleButtonGroup
                                size="small"
                                value={viewMode}
                                exclusive
                                onChange={(_, next) => next && setViewMode(next)}
                                sx={{ height: 38 }}
                            >
                                <ToggleButton value="list">
                                    <Tooltip title="Table View">
                                        <ViewListIcon fontSize="small" />
                                    </Tooltip>
                                </ToggleButton>
                                <ToggleButton value="grid">
                                    <Tooltip title="Cards View">
                                        <ViewModuleIcon fontSize="small" />
                                    </Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>

                            {hasActiveFilters && (
                                <Button
                                    size="small"
                                    color="inherit"
                                    onClick={clearFilters}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
                                >
                                    Reset
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                </Paper>

                {/* View Mode 1: Table List View */}
                {viewMode === 'list' && (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                        }}
                    >
                        <TableContainer>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC' }}>
                                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.78rem' }}>
                                            VEHICLE MODEL & SPECS
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.78rem' }}>
                                            CATEGORY
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.78rem' }}>
                                            STATUS
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.78rem' }}>
                                            FLEET SIZE
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.78rem' }}>
                                            BRANCH INVENTORY & AVAILABILITY
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.78rem' }}>
                                            ACTIONS
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredModels.map((model) => {
                                        const isExpanded = expanded === model.id;
                                        return (
                                            <React.Fragment key={model.id}>
                                                <TableRow
                                                    hover
                                                    sx={{
                                                        bgcolor: isExpanded
                                                            ? isDark
                                                                ? 'rgba(245, 158, 11, 0.05)'
                                                                : '#FFFBEB'
                                                            : 'inherit',
                                                    }}
                                                >
                                                    {/* Model & Specs */}
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Box
                                                                sx={{
                                                                    width: 42,
                                                                    height: 42,
                                                                    borderRadius: 2,
                                                                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'warning.main',
                                                                }}
                                                            >
                                                                <TwoWheelerIcon />
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                    {model.brand} {model.name}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: 0.4 }}>
                                                                    <Chip
                                                                        size="small"
                                                                        icon={
                                                                            model.fuel_type === 'electric' ? (
                                                                                <ElectricBoltIcon sx={{ fontSize: '13px !important' }} />
                                                                            ) : (
                                                                                <LocalGasStationIcon sx={{ fontSize: '13px !important' }} />
                                                                            )
                                                                        }
                                                                        label={model.fuel_type}
                                                                        color={model.fuel_type === 'electric' ? 'success' : 'default'}
                                                                        variant="outlined"
                                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize' }}
                                                                    />
                                                                    <Chip
                                                                        size="small"
                                                                        label={model.transmission}
                                                                        variant="outlined"
                                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Category */}
                                                    <TableCell>
                                                        <Chip
                                                            label={model.category_name || 'Uncategorized'}
                                                            size="small"
                                                            sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}
                                                        />
                                                    </TableCell>

                                                    {/* Status & Quick Toggle */}
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={model.is_active ? 'Active' : 'Disabled'}
                                                            size="small"
                                                            color={model.is_active ? 'success' : 'default'}
                                                            onClick={() => handleToggleActive(model)}
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.7rem',
                                                                cursor: 'pointer',
                                                                borderRadius: 1.5,
                                                                height: 22,
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Total Units */}
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={`${model.total_units} units`}
                                                            size="small"
                                                            color={model.total_units > 0 ? 'primary' : 'default'}
                                                            variant={model.total_units > 0 ? 'filled' : 'outlined'}
                                                            sx={{ fontWeight: 800, fontSize: '0.74rem' }}
                                                        />
                                                    </TableCell>

                                                    {/* Branch Inventory Breakdown */}
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                            {(model.branches || []).map((branch) => (
                                                                <Tooltip
                                                                    key={branch.store_id}
                                                                    title={`${branch.available_now} Available, ${branch.on_rent} On Rent, ${branch.maintenance} Maintenance, ${branch.retired} Retired`}
                                                                >
                                                                    <Chip
                                                                        size="small"
                                                                        variant="outlined"
                                                                        icon={<PlaceIcon sx={{ fontSize: '13px !important' }} />}
                                                                        label={`${branch.store_name}: ${branch.available_now}/${branch.total_units} avail`}
                                                                        color={branch.available_now > 0 ? 'success' : 'default'}
                                                                        sx={{
                                                                            height: 24,
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 700,
                                                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            ))}
                                                            {!model.branches?.length && (
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                                    No vehicles linked yet
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => startBulk(model)}
                                                                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                                                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                                                            >
                                                                Add Bikes
                                                            </Button>

                                                            <IconButton size="small" onClick={() => startEdit(model)} sx={{ color: 'text.secondary' }}>
                                                                <Tooltip title="Edit Model Specifications">
                                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                                </Tooltip>
                                                            </IconButton>

                                                            <Button
                                                                size="small"
                                                                variant={isExpanded ? 'contained' : 'text'}
                                                                color={isExpanded ? 'warning' : 'primary'}
                                                                endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                                onClick={() => setExpanded(isExpanded ? null : model.id)}
                                                                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 800 }}
                                                            >
                                                                {isExpanded ? 'Close' : 'Fleet & Rates'}
                                                            </Button>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded Details Drawer */}
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{ p: 0, borderBottom: isExpanded ? '1px solid' : 'none', borderColor: 'divider' }}>
                                                        <Collapse in={isExpanded} unmountOnExit>
                                                            <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : '#F8FAFC' }}>
                                                                <Grid container spacing={3} disableEqualOverflow>
                                                                    {/* Left Column: Registered Physical Vehicles */}
                                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                                        <Box
                                                                            sx={{
                                                                                p: 2.5,
                                                                                borderRadius: 2.5,
                                                                                bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                                                                                border: '1px solid',
                                                                                borderColor: 'divider',
                                                                                height: '100%',
                                                                            }}
                                                                        >
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                                <Box>
                                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                                        Registered Physical Vehicles ({model.units?.length || 0})
                                                                                    </Typography>
                                                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                        Individual number plates tracked at current hubs
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Button
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    startIcon={<AddIcon />}
                                                                                    onClick={() => startBulk(model)}
                                                                                    sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: 1.5 }}
                                                                                >
                                                                                    Batch Register
                                                                                </Button>
                                                                            </Box>

                                                                            {(model.units || []).length === 0 ? (
                                                                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                                                                    <DirectionsBikeIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                                        No vehicles are registered under this model yet.
                                                                                    </Typography>
                                                                                    <Button
                                                                                        size="small"
                                                                                        variant="text"
                                                                                        startIcon={<AddIcon />}
                                                                                        onClick={() => startBulk(model)}
                                                                                        sx={{ mt: 1, textTransform: 'none', fontWeight: 800 }}
                                                                                    >
                                                                                        Add First Fleet Batch
                                                                                    </Button>
                                                                                </Box>
                                                                            ) : (
                                                                                <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                                                                                    {(model.units || []).map((bike) => (
                                                                                        <Box
                                                                                            key={bike.id}
                                                                                            sx={{
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'space-between',
                                                                                                py: 1.2,
                                                                                                px: 1,
                                                                                                borderBottom: '1px solid',
                                                                                                borderColor: 'divider',
                                                                                                '&:last-child': { borderBottom: 'none' },
                                                                                            }}
                                                                                        >
                                                                                            <Box>
                                                                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                                                                                                    {bike.registration_number}
                                                                                                </Typography>
                                                                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                                                                    <PlaceIcon sx={{ fontSize: 13, color: 'text.secondary' }} /> {storeName(bike.current_store_id)}
                                                                                                </Typography>
                                                                                            </Box>

                                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                                <Chip
                                                                                                    size="small"
                                                                                                    label={bike.status.replaceAll('_', ' ')}
                                                                                                    color={
                                                                                                        bike.status === 'available'
                                                                                                            ? 'success'
                                                                                                            : bike.status === 'on_rent'
                                                                                                            ? 'primary'
                                                                                                            : bike.status === 'maintenance'
                                                                                                            ? 'warning'
                                                                                                            : 'default'
                                                                                                    }
                                                                                                    variant="outlined"
                                                                                                    sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize' }}
                                                                                                />
                                                                                                <Button
                                                                                                    component={Link}
                                                                                                    href={`/admin/bikes/${bike.id}/edit`}
                                                                                                    size="small"
                                                                                                    color="inherit"
                                                                                                    sx={{ textTransform: 'none', fontSize: '0.72rem' }}
                                                                                                >
                                                                                                    Manage
                                                                                                </Button>
                                                                                            </Stack>
                                                                                        </Box>
                                                                                    ))}
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    </Grid>

                                                                    {/* Right Column: Branch Rental Rates Matrix */}
                                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                                        <Box
                                                                            sx={{
                                                                                p: 2.5,
                                                                                borderRadius: 2.5,
                                                                                bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                                                                                border: '1px solid',
                                                                                borderColor: 'divider',
                                                                                height: '100%',
                                                                            }}
                                                                        >
                                                                            <Box sx={{ mb: 2 }}>
                                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                                                    <CurrencyRupeeIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                                                                                    Branch-Specific Rental Pricing Matrix
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                    Set distinct weekday (Mon–Thu) and weekend (Fri–Sun) daily rates per hub.
                                                                                </Typography>
                                                                            </Box>

                                                                            <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                                                                                {stores.map((store) => {
                                                                                    const prices = editRates(model, store);
                                                                                    const key = rateKey(model.id, store.id);
                                                                                    const isConfigured = (model.branch_prices || []).some(
                                                                                        (rate) => Number(rate.store_id) === Number(store.id)
                                                                                    );
                                                                                    const isSaving = savingRateKey === key;

                                                                                    return (
                                                                                        <Box
                                                                                            component="form"
                                                                                            onSubmit={(e) => handleSaveRates(e, model, store)}
                                                                                            key={store.id}
                                                                                            sx={{
                                                                                                p: 1.5,
                                                                                                borderRadius: 2,
                                                                                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                                                                                                border: '1px solid',
                                                                                                borderColor: isConfigured ? 'warning.main' : 'divider',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'space-between',
                                                                                                flexWrap: 'wrap',
                                                                                                gap: 1.5,
                                                                                            }}
                                                                                        >
                                                                                            <Box sx={{ minWidth: 140 }}>
                                                                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                                                    {store.name}
                                                                                                </Typography>
                                                                                                <Typography variant="caption" sx={{ color: isConfigured ? 'warning.main' : 'text.secondary', fontWeight: 600 }}>
                                                                                                    {isConfigured ? 'Custom Rates Active' : 'Default Base Rate'}
                                                                                                </Typography>
                                                                                            </Box>

                                                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                                                <TextField
                                                                                                    size="small"
                                                                                                    type="number"
                                                                                                    label="Mon–Thu"
                                                                                                    placeholder="0.00"
                                                                                                    value={prices.weekday_rate}
                                                                                                    onChange={(e) =>
                                                                                                        setRateEdits((prev) => ({
                                                                                                            ...prev,
                                                                                                            [key]: { ...prices, weekday_rate: e.target.value },
                                                                                                        }))
                                                                                                    }
                                                                                                    required
                                                                                                    InputProps={{
                                                                                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                                                                    }}
                                                                                                    sx={{ width: 120 }}
                                                                                                />

                                                                                                <TextField
                                                                                                    size="small"
                                                                                                    type="number"
                                                                                                    label="Fri–Sun"
                                                                                                    placeholder="0.00"
                                                                                                    value={prices.weekend_rate}
                                                                                                    onChange={(e) =>
                                                                                                        setRateEdits((prev) => ({
                                                                                                            ...prev,
                                                                                                            [key]: { ...prices, weekend_rate: e.target.value },
                                                                                                        }))
                                                                                                    }
                                                                                                    required
                                                                                                    InputProps={{
                                                                                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                                                                    }}
                                                                                                    sx={{ width: 120 }}
                                                                                                />

                                                                                                <Button
                                                                                                    type="submit"
                                                                                                    size="small"
                                                                                                    variant="outlined"
                                                                                                    color="warning"
                                                                                                    disabled={isSaving}
                                                                                                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5, height: 40 }}
                                                                                                >
                                                                                                    {isSaving ? <CircularProgress size={16} color="inherit" /> : 'Save'}
                                                                                                </Button>
                                                                                            </Stack>
                                                                                        </Box>
                                                                                    );
                                                                                })}
                                                                            </Stack>
                                                                        </Box>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}

                                    {filteredModels.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                                                <CategoryIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                    No bike models match your filters
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
                                                    Try adjusting your search query, or clear your filters to view all catalog entries.
                                                </Typography>
                                                <Button size="small" variant="outlined" onClick={clearFilters}>
                                                    Reset All Filters
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* View Mode 2: Grid Cards View */}
                {viewMode === 'grid' && (
                    <Grid container spacing={2}>
                        {filteredModels.map((model) => (
                            <Grid key={model.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            borderColor: 'warning.main',
                                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.06)',
                                        },
                                    }}
                                >
                                    {/* Top Card Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                                                    color: 'warning.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <TwoWheelerIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                    {model.brand} {model.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {model.category_name}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Chip
                                            label={model.is_active ? 'Active' : 'Disabled'}
                                            size="small"
                                            color={model.is_active ? 'success' : 'default'}
                                            onClick={() => handleToggleActive(model)}
                                            sx={{ fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer', height: 22 }}
                                        />
                                    </Box>

                                    {/* Specs Pills */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                                        <Chip
                                            size="small"
                                            icon={
                                                model.fuel_type === 'electric' ? (
                                                    <ElectricBoltIcon sx={{ fontSize: '13px !important' }} />
                                                ) : (
                                                    <LocalGasStationIcon sx={{ fontSize: '13px !important' }} />
                                                )
                                            }
                                            label={model.fuel_type}
                                            color={model.fuel_type === 'electric' ? 'success' : 'default'}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize' }}
                                        />
                                        <Chip
                                            size="small"
                                            label={model.transmission}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`${model.total_units} Vehicles`}
                                            color="primary"
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                                        />
                                    </Box>

                                    {model.description && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'text.secondary',
                                                mb: 2,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {model.description}
                                        </Typography>
                                    )}

                                    {/* Branch Inventory Mini Summary */}
                                    <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.8 }}>
                                            Deployment by Hub:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
                                            {(model.branches || []).map((b) => (
                                                <Chip
                                                    key={b.store_id}
                                                    size="small"
                                                    label={`${b.store_name}: ${b.available_now}/${b.total_units}`}
                                                    sx={{ height: 20, fontSize: '0.66rem', fontWeight: 600 }}
                                                />
                                            ))}
                                            {!model.branches?.length && (
                                                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                                    0 units deployed
                                                </Typography>
                                            )}
                                        </Box>

                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => {
                                                    setViewMode('list');
                                                    setExpanded(model.id);
                                                }}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 1.5,
                                                    fontWeight: 800,
                                                    fontSize: '0.75rem',
                                                    bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                                    color: isDark ? '#0F172A' : '#FFFFFF',
                                                }}
                                            >
                                                Manage Fleet & Rates
                                            </Button>
                                            <IconButton size="small" onClick={() => startEdit(model)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                                <EditIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Stack>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* Create Bike Model Dialog */}
            <Dialog
                open={createOpen}
                onClose={() => !createForm.processing && setCreateOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.12)',
                        overflowX: 'hidden',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CategoryIcon sx={{ color: 'warning.main' }} />
                        <span>Add New Bike Model</span>
                    </Stack>
                    <IconButton size="small" onClick={() => setCreateOpen(false)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleCreateSubmit} noValidate autoComplete="off">
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, overflowX: 'hidden' }}>
                        {Object.keys(createForm.errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please review and correct the errors below before saving.
                            </Alert>
                        )}

                        <Grid container spacing={2} disableEqualOverflow>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                                    1. Classification & Brand Information
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Global vehicle model catalog template. Physical vehicles inherit these specs upon registration.
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    size="small"
                                    label="Vehicle Category"
                                    value={createForm.data.category_id}
                                    onChange={(e) => createForm.setData('category_id', e.target.value)}
                                    error={Boolean(createForm.errors.category_id)}
                                    helperText={createForm.errors.category_id || 'E.g. Scooter, Cruiser, Sports'}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Brand / Manufacturer"
                                    placeholder="e.g. Honda, Royal Enfield, Yamaha"
                                    value={createForm.data.brand}
                                    onChange={(e) => createForm.setData('brand', e.target.value)}
                                    error={Boolean(createForm.errors.brand)}
                                    helperText={createForm.errors.brand}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Model Name"
                                    placeholder="e.g. Activa 6G, Classic 350, Aerox"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    error={Boolean(createForm.errors.name)}
                                    helperText={createForm.errors.name}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 3 }}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    size="small"
                                    label="Fuel Type"
                                    value={createForm.data.fuel_type}
                                    onChange={(e) => createForm.setData('fuel_type', e.target.value)}
                                >
                                    <MenuItem value="petrol">Petrol</MenuItem>
                                    <MenuItem value="electric">Electric</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 3 }}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    size="small"
                                    label="Transmission"
                                    value={createForm.data.transmission}
                                    onChange={(e) => createForm.setData('transmission', e.target.value)}
                                >
                                    <MenuItem value="automatic">Automatic (Scooter)</MenuItem>
                                    <MenuItem value="manual">Manual (Geared)</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                                    2. Customer Presentation & Descriptions
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    size="small"
                                    label="Model Description & Features (Optional)"
                                    placeholder="e.g. Reliable 110cc scooter with great mileage, comfortable dual seating, under-seat storage, and combi-brake system."
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    error={Boolean(createForm.errors.description)}
                                    helperText={createForm.errors.description || 'Displayed to customers on public rental search and booking cards'}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={createForm.processing}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3.5,
                                fontWeight: 800,
                                bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                color: isDark ? '#0F172A' : '#FFFFFF',
                            }}
                        >
                            {createForm.processing ? <CircularProgress size={20} color="inherit" /> : 'Create Model'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Edit Bike Model Dialog */}
            <Dialog
                open={editOpen}
                onClose={() => !editForm.processing && setEditOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.12)',
                        overflowX: 'hidden',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <EditIcon sx={{ color: 'warning.main' }} />
                        <span>Edit Model: {editingModel?.brand} {editingModel?.name}</span>
                    </Stack>
                    <IconButton size="small" onClick={() => setEditOpen(false)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleEditSubmit} noValidate autoComplete="off">
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, overflowX: 'hidden' }}>
                        {Object.keys(editForm.errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please review and correct the errors below before saving.
                            </Alert>
                        )}

                        <Grid container spacing={2} disableEqualOverflow>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    size="small"
                                    label="Vehicle Category"
                                    value={editForm.data.category_id}
                                    onChange={(e) => editForm.setData('category_id', e.target.value)}
                                    error={Boolean(editForm.errors.category_id)}
                                    helperText={editForm.errors.category_id}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Brand / Manufacturer"
                                    value={editForm.data.brand}
                                    onChange={(e) => editForm.setData('brand', e.target.value)}
                                    error={Boolean(editForm.errors.brand)}
                                    helperText={editForm.errors.brand}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Model Name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    error={Boolean(editForm.errors.name)}
                                    helperText={editForm.errors.name}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 3 }}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    size="small"
                                    label="Fuel Type"
                                    value={editForm.data.fuel_type}
                                    onChange={(e) => editForm.setData('fuel_type', e.target.value)}
                                >
                                    <MenuItem value="petrol">Petrol</MenuItem>
                                    <MenuItem value="electric">Electric</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 3 }}>
                                <TextField
                                    select
                                    required
                                    fullWidth
                                    size="small"
                                    label="Transmission"
                                    value={editForm.data.transmission}
                                    onChange={(e) => editForm.setData('transmission', e.target.value)}
                                >
                                    <MenuItem value="automatic">Automatic</MenuItem>
                                    <MenuItem value="manual">Manual</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    size="small"
                                    label="Model Description & Features"
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    error={Boolean(editForm.errors.description)}
                                    helperText={editForm.errors.description}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={editForm.processing}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3.5,
                                fontWeight: 800,
                                bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                color: isDark ? '#0F172A' : '#FFFFFF',
                            }}
                        >
                            {editForm.processing ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Bulk Register Vehicles Dialog */}
            <Dialog
                open={Boolean(bulkModel)}
                onClose={() => !bulkProcessing && setBulkModel(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.12)',
                        overflowX: 'hidden',
                    },
                }}
            >
                <Box component="form" onSubmit={submitBulk} noValidate autoComplete="off">
                    <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TwoWheelerIcon sx={{ color: 'warning.main' }} />
                            <span>
                                Register Multiple {bulkModel?.brand} {bulkModel?.name} Vehicles
                            </span>
                        </Stack>
                        <IconButton size="small" onClick={() => setBulkModel(null)}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, overflowX: 'hidden' }}>
                        <Stack spacing={2.5}>
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Bulk registration provisions individual physical vehicles with their unique number plates and connects them directly to this model's specifications.
                            </Alert>

                            <FormControl fullWidth size="small" error={Boolean(bulkErrors.store_id)}>
                                <InputLabel id="bulk-store-label">Receiving Branch Location (Home & Current)</InputLabel>
                                <Select
                                    labelId="bulk-store-label"
                                    required
                                    value={bulkStore}
                                    label="Receiving Branch Location (Home & Current)"
                                    onChange={(e) => setBulkStore(e.target.value)}
                                >
                                    {stores.map((store) => (
                                        <MenuItem key={store.id} value={store.id}>
                                            {store.name} ({store.city})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                Vehicle Number Plates & Initial Odometers ({bulkRows.length}/50)
                            </Typography>

                            <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={{ borderRadius: 2, maxHeight: 300, overflowY: 'auto' }}
                            >
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                                            <TableCell sx={{ width: 40, fontWeight: 700 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>REGISTRATION NUMBER *</TableCell>
                                            <TableCell sx={{ fontWeight: 700, width: 180 }}>ODOMETER (KM)</TableCell>
                                            <TableCell align="right" sx={{ width: 60 }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {bulkRows.map((row, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        required
                                                        fullWidth
                                                        size="small"
                                                        placeholder="KA-47-EA-1001"
                                                        value={row.registration_number}
                                                        onChange={(e) => changeRow(index, 'registration_number', e.target.value.toUpperCase())}
                                                        error={Boolean(bulkErrors[`bikes.${index}.registration_number`])}
                                                        helperText={bulkErrors[`bikes.${index}.registration_number`]}
                                                        inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 } }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        placeholder="0"
                                                        value={row.odometer_reading}
                                                        onChange={(e) => changeRow(index, 'odometer_reading', e.target.value)}
                                                        inputProps={{ min: 0 }}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={bulkRows.length === 1 || bulkProcessing}
                                                        onClick={() => setBulkRows((rows) => rows.filter((_, i) => i !== index))}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    disabled={bulkRows.length >= 50 || bulkProcessing}
                                    onClick={() => setBulkRows((rows) => [...rows, { registration_number: '', odometer_reading: 0 }])}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
                                >
                                    Add Another Vehicle ({bulkRows.length}/50)
                                </Button>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Up to 50 vehicles per batch
                                </Typography>
                            </Box>

                            {Object.entries(bulkErrors)
                                .filter(([key]) => !key.startsWith('bikes.'))
                                .map(([key, message]) => (
                                    <Alert severity="error" key={key} sx={{ borderRadius: 2 }}>
                                        {message}
                                    </Alert>
                                ))}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button disabled={bulkProcessing} onClick={() => setBulkModel(null)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={bulkProcessing || !bulkStore || bulkRows.some((row) => !row.registration_number.trim())}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3.5,
                                fontWeight: 800,
                                bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                color: isDark ? '#0F172A' : '#FFFFFF',
                            }}
                        >
                            {bulkProcessing ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                `Register ${bulkRows.length} ${bulkRows.length === 1 ? 'Vehicle' : 'Vehicles'}`
                            )}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </AdminLayout>
    );
}

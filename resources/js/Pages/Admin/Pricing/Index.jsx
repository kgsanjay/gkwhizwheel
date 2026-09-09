import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    Switch,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Collapse,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import PoolIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import CalculateIcon from '@mui/icons-material/Calculate';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloseIcon from '@mui/icons-material/Close';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday (Alt)' },
];

const SERVICE_DOMAINS = [
    { id: '', label: 'All Domains', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
    { id: 'two_wheelers', label: 'Fleet Bikes', icon: <TwoWheelerIcon sx={{ fontSize: 16 }} />, color: '#F59E0B' },
    { id: 'taxi', label: 'Cabs & Taxi', icon: <LocalTaxiIcon sx={{ fontSize: 16 }} />, color: '#38BDF8' },
    { id: 'boating', label: 'Boating Safaris', icon: <DirectionsBoatIcon sx={{ fontSize: 16 }} />, color: '#10B981' },
    { id: 'scuba', label: 'Netrani Scuba', icon: <PoolIcon sx={{ fontSize: 16 }} />, color: '#06B6D4' },
    { id: 'homestay', label: 'Homestays', icon: <HomeWorkIcon sx={{ fontSize: 16 }} />, color: '#EC4899' },
    { id: 'guide', label: 'Tour Guides', icon: <ExploreIcon sx={{ fontSize: 16 }} />, color: '#8B5CF6' },
    { id: 'tours', label: 'Tour Packages', icon: <LuggageIcon sx={{ fontSize: 16 }} />, color: '#F97316' },
];

export default function PricingIndex({
    rules = [],
    categories = [],
    stores = [],
    bikes = [],
    service_items = [],
    rule_types = [],
    rate_types = [],
    stats = {},
    filters = {},
}) {
    const muiTheme = useTheme();
    const isDark = muiTheme.palette.mode === 'dark';
    const [selectedType, setSelectedType] = useState(filters.rule_type || '');
    const [selectedServiceType, setSelectedServiceType] = useState(filters.service_type || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedActive, setSelectedActive] = useState(filters.is_active || '');
    const [viewMode, setViewMode] = useState('list');

    // Simulator widget state
    const [simulatorOpen, setSimulatorOpen] = useState(false);
    const [simDomain, setSimDomain] = useState('service');
    const [simServiceType, setSimServiceType] = useState('taxi');
    const [simServiceItemId, setSimServiceItemId] = useState('');
    const [simBikeId, setSimBikeId] = useState('');
    const [simDate, setSimDate] = useState(new Date().toISOString().split('T')[0]);
    const [simQuantity, setSimQuantity] = useState(1);
    const [simLoading, setSimLoading] = useState(false);
    const [simResult, setSimResult] = useState(null);
    const [simError, setSimError] = useState('');

    // Create / Edit modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRule, setDeletingRule] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        target_domain: 'service', // 'service' or 'bike'
        service_type: 'taxi',
        service_item_id: '',
        rule_type: 'weekend',
        rate_type: 'percentage',
        value: '',
        day_of_week: 0,
        date_start: '',
        date_end: '',
        from_store_id: '',
        to_store_id: '',
        category_id: '',
        bike_id: '',
        priority: 10,
        is_active: true,
    });

    const handleFilterChange = (newType, newCat, newActive, newServiceType) => {
        router.get(
            '/admin/pricing',
            {
                rule_type: newType !== undefined ? newType : selectedType,
                category_id: newCat !== undefined ? newCat : selectedCategory,
                is_active: newActive !== undefined ? newActive : selectedActive,
                service_type: newServiceType !== undefined ? newServiceType : selectedServiceType,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleOpenCreate = () => {
        reset();
        clearErrors();
        setData({
            name: '',
            target_domain: selectedServiceType && selectedServiceType !== 'two_wheelers' ? 'service' : 'service',
            service_type: selectedServiceType && selectedServiceType !== 'two_wheelers' ? selectedServiceType : 'taxi',
            service_item_id: '',
            rule_type: 'weekend',
            rate_type: 'percentage',
            value: '',
            day_of_week: 0,
            date_start: '',
            date_end: '',
            from_store_id: '',
            to_store_id: '',
            category_id: '',
            bike_id: '',
            priority: 10,
            is_active: true,
        });
        setEditingRule(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (rule) => {
        clearErrors();
        setEditingRule(rule);
        const isService = Boolean(rule.service_type && rule.service_type !== 'two_wheelers');
        setData({
            name: rule.name || '',
            target_domain: isService ? 'service' : 'bike',
            service_type: rule.service_type || 'taxi',
            service_item_id: rule.service_item_id || '',
            rule_type: rule.rule_type,
            rate_type: rule.rate_type,
            value: rule.value,
            day_of_week: rule.day_of_week ?? 0,
            date_start: rule.date_start || '',
            date_end: rule.date_end || '',
            from_store_id: rule.from_store_id || '',
            to_store_id: rule.to_store_id || '',
            category_id: rule.category_id || '',
            bike_id: rule.bike_id || '',
            priority: rule.priority ?? 0,
            is_active: rule.is_active,
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...data };
        if (payload.target_domain === 'service') {
            payload.bike_id = '';
            payload.category_id = '';
            payload.from_store_id = '';
            payload.to_store_id = '';
        } else {
            payload.service_type = 'two_wheelers';
            payload.service_item_id = '';
        }

        if (editingRule) {
            put(`/admin/pricing/${editingRule.id}`, {
                data: payload,
                onSuccess: () => {
                    setModalOpen(false);
                    setEditingRule(null);
                },
            });
        } else {
            post('/admin/pricing', {
                data: payload,
                onSuccess: () => {
                    setModalOpen(false);
                },
            });
        }
    };

    const handleToggleActive = (rule) => {
        router.post(`/admin/pricing/${rule.id}/toggle`, {}, { preserveScroll: true });
    };

    const handleConfirmDelete = () => {
        if (!deletingRule) return;
        router.delete(`/admin/pricing/${deletingRule.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingRule(null);
            },
        });
    };

    // Live Simulator API Call
    const handleRunSimulation = async () => {
        setSimLoading(true);
        setSimError('');
        setSimResult(null);

        try {
            const res = await window.axios.post('/admin/pricing/simulate-quote', {
                domain: simDomain,
                service_type: simServiceType,
                service_item_id: simServiceItemId || null,
                bike_id: simBikeId || null,
                start_date: simDate,
                quantity: simQuantity,
            });

            if (res.data?.success) {
                setSimResult(res.data.quote);
            } else {
                setSimError(res.data?.message || 'Could not calculate quote.');
            }
        } catch (err) {
            setSimError(err.response?.data?.message || err.message || 'Simulation failed.');
        } finally {
            setSimLoading(false);
        }
    };

    const getDomainChip = (rule) => {
        if (rule.service_type && rule.service_type !== 'two_wheelers') {
            const s = SERVICE_DOMAINS.find((d) => d.id === rule.service_type);
            return (
                <Chip
                    icon={s?.icon}
                    label={s?.label || rule.service_type.toUpperCase()}
                    size="small"
                    sx={{
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        bgcolor: `${s?.color || '#0284C7'}18`,
                        color: s?.color || '#0284C7',
                        border: `1px solid ${s?.color || '#0284C7'}33`,
                    }}
                />
            );
        }
        return (
            <Chip
                icon={<TwoWheelerIcon sx={{ fontSize: 15 }} />}
                label="Fleet Two-Wheelers"
                size="small"
                sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                    color: 'warning.main',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
            />
        );
    };

    const getRuleTypeChip = (type) => {
        switch (type) {
            case 'weekend':
                return <Chip icon={<CalendarMonthIcon fontSize="small" />} label="Weekend Surge" size="small" color="primary" sx={{ fontWeight: 700 }} />;
            case 'holiday':
                return <Chip icon={<EventIcon fontSize="small" />} label="Holiday Surge" size="small" color="warning" sx={{ fontWeight: 700 }} />;
            case 'seasonal':
                return <Chip icon={<DateRangeIcon fontSize="small" />} label="Seasonal Multiplier" size="small" color="secondary" sx={{ fontWeight: 700 }} />;
            case 'one_way_fee':
                return <Chip icon={<AltRouteIcon fontSize="small" />} label="One-Way Relocation" size="small" color="info" sx={{ fontWeight: 700 }} />;
            default:
                return <Chip label={type} size="small" />;
        }
    };

    const formatAdjustment = (rule) => {
        const val = Number(rule.value);
        if (rule.rate_type === 'percentage') {
            return `${val >= 0 ? '+' : ''}${val}%`;
        }
        if (rule.rate_type === 'fixed_override') {
            return `₹${val.toLocaleString('en-IN')} fixed override`;
        }
        return `+₹${val.toLocaleString('en-IN')} flat`;
    };

    const formatTargetDetails = (rule) => {
        switch (rule.rule_type) {
            case 'weekend': {
                const day = DAYS_OF_WEEK.find((d) => d.value === rule.day_of_week);
                return day ? day.label : `Day ${rule.day_of_week}`;
            }
            case 'holiday':
                return rule.date_start ? `Date: ${rule.date_start}` : 'Specific holiday';
            case 'seasonal':
                return `${rule.date_start || 'Start'} to ${rule.date_end || 'End'}`;
            case 'one_way_fee':
                return (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{rule.from_store?.name || 'Any Origin'}</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{rule.to_store?.name || 'Any Destination'}</Typography>
                    </Stack>
                );
            default:
                return '—';
        }
    };

    const filteredServiceItemsForSelect = service_items.filter((item) => {
        if (!data.service_type) return true;
        return item.service_type === data.service_type;
    });

    return (
        <AdminLayout title="Dynamic Pricing & Surge Engine">
            <Head title="Dynamic Pricing Rules & Surge Engine - Admin" />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Dynamic Pricing & Surge Rules
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Manage automated weekend multipliers, seasonal surges (Gokarna holiday peaks), and one-way relocation rates across all fleet and travel services.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<CalculateIcon />}
                        onClick={() => setSimulatorOpen(!simulatorOpen)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                        {simulatorOpen ? 'Close Simulator' : 'Test Dynamic Quote'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 2.5,
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                        }}
                    >
                        Create Surge Rule
                    </Button>
                </Stack>
            </Box>

            {/* Metrics Strip */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Total Rules
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {stats.total ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Active Rules
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                            {stats.active ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Weekend Surges
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                            {stats.weekend ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Peak Seasonal
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'secondary.main' }}>
                            {stats.seasonal ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Holiday Surges
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'warning.main' }}>
                            {stats.holiday ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Travel Services
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'info.main' }}>
                            {stats.services_count ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Dynamic Pricing & Surge Simulator Widget */}
            <Collapse in={simulatorOpen}>
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        border: '1.5px solid',
                        borderColor: isDark ? 'rgba(56,189,248,0.4)' : '#38BDF8',
                        bgcolor: isDark ? 'rgba(56,189,248,0.05)' : 'rgba(56,189,248,0.03)',
                        boxShadow: '0 8px 24px rgba(56,189,248,0.08)',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FlashOnIcon sx={{ color: 'info.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'info.dark' }}>
                                Live Dynamic Pricing & Surge Simulator
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setSimulatorOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Select any vehicle or travel service item with a travel date to verify how active weekend, holiday, and seasonal surge rules evaluate in real-time.
                    </Typography>

                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Domain"
                                value={simDomain}
                                onChange={(e) => setSimDomain(e.target.value)}
                            >
                                <MenuItem value="service">Travel Services</MenuItem>
                                <MenuItem value="bike">Fleet Two-Wheelers</MenuItem>
                            </TextField>
                        </Grid>

                        {simDomain === 'service' ? (
                            <>
                                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Service Vertical"
                                        value={simServiceType}
                                        onChange={(e) => {
                                            setSimServiceType(e.target.value);
                                            setSimServiceItemId('');
                                        }}
                                    >
                                        <MenuItem value="taxi">Cabs & Taxi</MenuItem>
                                        <MenuItem value="boating">Boating Safaris</MenuItem>
                                        <MenuItem value="scuba">Netrani Scuba</MenuItem>
                                        <MenuItem value="homestay">Homestays</MenuItem>
                                        <MenuItem value="guide">Tour Guides</MenuItem>
                                        <MenuItem value="tours">Tour Packages</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Specific Item (Optional)"
                                        value={simServiceItemId}
                                        onChange={(e) => setSimServiceItemId(e.target.value)}
                                    >
                                        <MenuItem value="">First available item</MenuItem>
                                        {service_items
                                            .filter((item) => item.service_type === simServiceType)
                                            .map((item) => (
                                                <MenuItem key={item.id} value={item.id}>
                                                    {item.name} (Base ₹{parseFloat(item.price_base).toLocaleString('en-IN')})
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                </Grid>
                            </>
                        ) : (
                            <Grid size={{ xs: 12, sm: 6, md: 5.5 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Select Fleet Bike"
                                    value={simBikeId}
                                    onChange={(e) => setSimBikeId(e.target.value)}
                                >
                                    <MenuItem value="">Default Fleet Bike</MenuItem>
                                    {bikes.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.brand} {b.model_name} ({b.registration_number})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}

                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Simulated Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                InputLabelProps={{ shrink: true }}
                                value={simDate}
                                onChange={(e) => setSimDate(e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="info"
                                onClick={handleRunSimulation}
                                disabled={simLoading}
                                startIcon={simLoading ? <CircularProgress size={16} color="inherit" /> : <FlashOnIcon />}
                                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1 }}
                            >
                                {simLoading ? 'Calculating...' : 'Run Quote'}
                            </Button>
                        </Grid>
                    </Grid>

                    {simError && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                            {simError}
                        </Alert>
                    )}

                    {simResult && (
                        <Box sx={{ mt: 2.5, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                        Item / Package
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {simResult.service_item_name || 'Fleet Two-Wheeler Rental'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Date: {simResult.travel_date || simDate}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                        Base Unit Rate
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        ₹{parseFloat(simResult.base_unit_rate || simResult.base_amount || 0).toLocaleString('en-IN')}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                        Surge Surcharge
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: (simResult.surge_amount || simResult.pricing_adjustments_amount) > 0 ? 'error.main' : 'text.primary' }}>
                                        +₹{parseFloat(simResult.surge_amount || simResult.pricing_adjustments_amount || 0).toLocaleString('en-IN')}
                                    </Typography>
                                    {(simResult.surge_percentage > 0) && (
                                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                                            (+{simResult.surge_percentage}%)
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                        Total Dynamic Rate
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>
                                        ₹{parseFloat(simResult.total_amount).toLocaleString('en-IN')}
                                    </Typography>
                                    {simResult.breakdown?.has_surge && (
                                        <Chip
                                            label={simResult.breakdown.surge_label || 'Surge Active'}
                                            size="small"
                                            color="error"
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, mt: 0.5 }}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Paper>
            </Collapse>

            {/* Service Domain Navigation Filter Chips */}
            <Paper sx={{ p: 1.5, borderRadius: 3, mb: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', px: 1, display: 'block', mb: 1 }}>
                    Filter By Service Domain
                </Typography>
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                    {SERVICE_DOMAINS.map((domain) => {
                        const isSelected = selectedServiceType === domain.id;
                        return (
                            <Chip
                                key={domain.id}
                                icon={domain.icon}
                                label={domain.label}
                                onClick={() => {
                                    setSelectedServiceType(domain.id);
                                    handleFilterChange(undefined, undefined, undefined, domain.id);
                                }}
                                variant={isSelected ? 'filled' : 'outlined'}
                                color={isSelected ? 'primary' : 'default'}
                                sx={{
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    borderColor: isSelected ? 'transparent' : 'divider',
                                }}
                            />
                        );
                    })}
                </Stack>
            </Paper>

            {/* Filter Controls Bar */}
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Rule Category / Type"
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                handleFilterChange(e.target.value, undefined, undefined, undefined);
                            }}
                        >
                            <MenuItem value="">All Rule Types</MenuItem>
                            <MenuItem value="weekend">Weekend Surge</MenuItem>
                            <MenuItem value="holiday">Holiday Surge</MenuItem>
                            <MenuItem value="seasonal">Seasonal Period</MenuItem>
                            <MenuItem value="one_way_fee">One-Way Relocation Fee</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Vehicle Category Scope"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                handleFilterChange(undefined, e.target.value, undefined, undefined);
                            }}
                        >
                            <MenuItem value="">All Vehicle Categories</MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Active Status"
                            value={selectedActive}
                            onChange={(e) => {
                                setSelectedActive(e.target.value);
                                handleFilterChange(undefined, undefined, e.target.value, undefined);
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="1">Active Only</MenuItem>
                            <MenuItem value="0">Inactive Only</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
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

            {/* Content Display: List View or Grid View */}
            {rules.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        No pricing rules found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Try clearing filter criteria or create a new surge rule for fleet bikes or travel services.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Create First Rule
                    </Button>
                </Paper>
            ) : viewMode === 'list' ? (
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 920 }}>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Domain / Service</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Rule Name & Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Target Condition / Route</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Rate Multiplier</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Item / Fleet Scope</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id} hover sx={{ opacity: rule.is_active ? 1 : 0.65 }}>
                                    <TableCell>{getDomainChip(rule)}</TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                            {rule.name || rule.rule_type.replace('_', ' ').toUpperCase()}
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            {getRuleTypeChip(rule.rule_type)}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {formatTargetDetails(rule)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatAdjustment(rule)}
                                            size="small"
                                            color={rule.rate_type === 'percentage' ? 'success' : 'info'}
                                            variant="outlined"
                                            sx={{ fontWeight: 800 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {rule.service_item ? (
                                            <Chip label={rule.service_item.name} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                                        ) : rule.service_type && rule.service_type !== 'two_wheelers' ? (
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                All items in {rule.service_type}
                                            </Typography>
                                        ) : rule.bike ? (
                                            <Chip icon={<TwoWheelerIcon fontSize="small" />} label={rule.bike.registration_number} size="small" variant="outlined" />
                                        ) : rule.category ? (
                                            <Chip label={rule.category.name} size="small" variant="outlined" />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">All Fleet</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={`P${rule.priority}`} size="small" sx={{ fontWeight: 700, minWidth: 40 }} />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            size="small"
                                            checked={rule.is_active}
                                            onChange={() => handleToggleActive(rule)}
                                            color="success"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(rule)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setDeletingRule(rule);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Grid container spacing={2}>
                    {rules.map((rule) => (
                        <Grid key={rule.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', opacity: rule.is_active ? 1 : 0.7 }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {getDomainChip(rule)}
                                            {getRuleTypeChip(rule.rule_type)}
                                        </Stack>
                                        <Switch
                                            size="small"
                                            checked={rule.is_active}
                                            onChange={() => handleToggleActive(rule)}
                                            color="success"
                                        />
                                    </Box>

                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                                        {rule.name || rule.rule_type.toUpperCase()}
                                    </Typography>

                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'success.main', mb: 1.5 }}>
                                        {formatAdjustment(rule)}
                                    </Typography>

                                    <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                                            CONDITION / TARGET
                                        </Typography>
                                        <Box>{formatTargetDetails(rule)}</Box>
                                    </Box>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Scope:{' '}
                                            {rule.service_item?.name ||
                                                (rule.service_type ? `All ${rule.service_type}` : rule.bike?.registration_number || rule.category?.name || 'All Fleet')}
                                        </Typography>
                                        <Chip label={`Priority: ${rule.priority}`} size="small" sx={{ fontWeight: 600 }} />
                                    </Stack>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon fontSize="small" />}
                                            onClick={() => handleOpenEdit(rule)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon fontSize="small" />}
                                            onClick={() => {
                                                setDeletingRule(rule);
                                                setDeleteDialogOpen(true);
                                            }}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Delete
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create / Edit Rule Dialog */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {editingRule ? 'Edit Dynamic Pricing Rule' : 'Create Dynamic Pricing & Surge Rule'}
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {Object.keys(errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please check the form errors below.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {/* Rule Name */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Rule Name / Friendly Label"
                                    placeholder="e.g. Gokarna Peak Season Surge 25% or Weekend Cab Multiplier"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={Boolean(errors.name)}
                                    helperText={errors.name || 'Descriptive label visible in quote simulator and customer receipts'}
                                />
                            </Grid>

                            {/* Target Domain Selection */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                                    TARGET DOMAIN
                                </Typography>
                                <ToggleButtonGroup
                                    fullWidth
                                    size="small"
                                    value={data.target_domain}
                                    exclusive
                                    onChange={(_, val) => val && setData('target_domain', val)}
                                >
                                    <ToggleButton value="service" sx={{ fontWeight: 700 }}>
                                        Travel Services (Cabs, Boating, Scuba, Stays)
                                    </ToggleButton>
                                    <ToggleButton value="bike" sx={{ fontWeight: 700 }}>
                                        Two-Wheeler Fleet
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>

                            {/* Conditional Domain Fields: Travel Service */}
                            {data.target_domain === 'service' ? (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Service Vertical"
                                            value={data.service_type}
                                            onChange={(e) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    service_type: e.target.value,
                                                    service_item_id: '',
                                                }));
                                            }}
                                            error={Boolean(errors.service_type)}
                                            helperText={errors.service_type}
                                        >
                                            <MenuItem value="taxi">Cabs & Taxi</MenuItem>
                                            <MenuItem value="boating">Backwater Boating</MenuItem>
                                            <MenuItem value="scuba">Netrani Scuba Diving</MenuItem>
                                            <MenuItem value="homestay">Coastal Homestays</MenuItem>
                                            <MenuItem value="guide">Tour Guides</MenuItem>
                                            <MenuItem value="tours">Tour Packages</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Specific Package / Item"
                                            value={data.service_item_id}
                                            onChange={(e) => setData('service_item_id', e.target.value)}
                                            error={Boolean(errors.service_item_id)}
                                            helperText="Leave empty to apply across all packages"
                                        >
                                            <MenuItem value="">All items in this service</MenuItem>
                                            {filteredServiceItemsForSelect.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>
                                                    {item.name} (Base ₹{parseFloat(item.price_base).toLocaleString('en-IN')})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </>
                            ) : (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Vehicle Category Scope"
                                            value={data.category_id}
                                            onChange={(e) => setData('category_id', e.target.value)}
                                            error={Boolean(errors.category_id)}
                                            helperText="Leave empty to apply to all categories"
                                        >
                                            <MenuItem value="">All Vehicle Categories</MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Specific Bike Scope"
                                            value={data.bike_id}
                                            onChange={(e) => setData('bike_id', e.target.value)}
                                            error={Boolean(errors.bike_id)}
                                            helperText="Leave empty for all bikes"
                                        >
                                            <MenuItem value="">All Fleet / No specific bike</MenuItem>
                                            {bikes.map((b) => (
                                                <MenuItem key={b.id} value={b.id}>
                                                    {b.brand} {b.model_name} ({b.registration_number})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </>
                            )}

                            {/* Rule Type */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Rule Type"
                                    value={data.rule_type}
                                    onChange={(e) => setData('rule_type', e.target.value)}
                                    error={Boolean(errors.rule_type)}
                                    helperText={errors.rule_type}
                                >
                                    {rule_types.map((t) => (
                                        <MenuItem key={t.value} value={t.value}>
                                            {t.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Conditional Fields: Weekend */}
                            {data.rule_type === 'weekend' && (
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Applicable Day of Week"
                                        value={data.day_of_week}
                                        onChange={(e) => setData('day_of_week', Number(e.target.value))}
                                        error={Boolean(errors.day_of_week)}
                                        helperText={errors.day_of_week || 'Select the weekend day to apply surge rate (default: Sat & Sun).'}
                                    >
                                        {DAYS_OF_WEEK.map((d) => (
                                            <MenuItem key={d.value} value={d.value}>
                                                {d.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}

                            {/* Conditional Fields: Holiday */}
                            {data.rule_type === 'holiday' && (
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Holiday Date"
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        InputLabelProps={{ shrink: true }}
                                        value={data.date_start}
                                        onChange={(e) => setData('date_start', e.target.value)}
                                        error={Boolean(errors.date_start)}
                                        helperText={errors.date_start || 'Exact calendar date for the holiday.'}
                                    />
                                </Grid>
                            )}

                            {/* Conditional Fields: Seasonal */}
                            {data.rule_type === 'seasonal' && (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Season Start Date"
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            InputLabelProps={{ shrink: true }}
                                            value={data.date_start}
                                            onChange={(e) => setData('date_start', e.target.value)}
                                            error={Boolean(errors.date_start)}
                                            helperText={errors.date_start}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Season End Date"
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            InputLabelProps={{ shrink: true }}
                                            value={data.date_end}
                                            onChange={(e) => setData('date_end', e.target.value)}
                                            error={Boolean(errors.date_end)}
                                            helperText={errors.date_end}
                                        />
                                    </Grid>
                                </>
                            )}

                            {/* Conditional Fields: One-Way Fee */}
                            {data.rule_type === 'one_way_fee' && (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Origin Hub"
                                            value={data.from_store_id}
                                            onChange={(e) => setData('from_store_id', e.target.value)}
                                            error={Boolean(errors.from_store_id)}
                                            helperText={errors.from_store_id}
                                        >
                                            <MenuItem value="">Select Origin Hub</MenuItem>
                                            {stores.map((st) => (
                                                <MenuItem key={st.id} value={st.id}>
                                                    {st.name} ({st.city})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Destination Hub"
                                            value={data.to_store_id}
                                            onChange={(e) => setData('to_store_id', e.target.value)}
                                            error={Boolean(errors.to_store_id)}
                                            helperText={errors.to_store_id}
                                        >
                                            <MenuItem value="">Select Destination Hub</MenuItem>
                                            {stores.map((st) => (
                                                <MenuItem key={st.id} value={st.id}>
                                                    {st.name} ({st.city})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </>
                            )}

                            {/* Rate Type & Adjustment Value */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Rate Adjustment Type"
                                    value={data.rate_type}
                                    onChange={(e) => setData('rate_type', e.target.value)}
                                    error={Boolean(errors.rate_type)}
                                    helperText={errors.rate_type}
                                >
                                    {rate_types.map((rt) => (
                                        <MenuItem key={rt.value} value={rt.value}>
                                            {rt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Adjustment Value"
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    error={Boolean(errors.value)}
                                    helperText={
                                        errors.value ||
                                        (data.rate_type === 'percentage'
                                            ? 'e.g. 25 for +25% peak multiplier'
                                            : 'e.g. 1500 for fixed or flat rate')
                                    }
                                />
                            </Grid>

                            {/* Priority & Active Switch */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Evaluation Priority"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', Number(e.target.value))}
                                    error={Boolean(errors.priority)}
                                    helperText="Higher number evaluates first (0 - 255)"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            color="success"
                                        />
                                    }
                                    label="Rule Active Immediately"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={processing}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                        >
                            {processing ? <CircularProgress size={20} color="inherit" /> : editingRule ? 'Update Rule' : 'Create Rule'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Deletion Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Rule Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this dynamic pricing rule? This will immediately stop applying this surcharge or relocation fee during checkout quotes.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Delete Rule
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

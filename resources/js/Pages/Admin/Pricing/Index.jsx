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

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

export default function PricingIndex({
    rules = [],
    categories = [],
    stores = [],
    bikes = [],
    rule_types = [],
    rate_types = [],
    stats = {},
    filters = {},
}) {
    const [selectedType, setSelectedType] = useState(filters.rule_type || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedActive, setSelectedActive] = useState(filters.is_active || '');
    const [viewMode, setViewMode] = useState('list');

    // Create / Edit modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRule, setDeletingRule] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
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

    const handleFilterChange = (newType, newCat, newActive) => {
        router.get(
            '/admin/pricing',
            {
                rule_type: newType !== undefined ? newType : selectedType,
                category_id: newCat !== undefined ? newCat : selectedCategory,
                is_active: newActive !== undefined ? newActive : selectedActive,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleOpenCreate = () => {
        reset();
        clearErrors();
        setData({
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
        setData({
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
        if (editingRule) {
            put(`/admin/pricing/${editingRule.id}`, {
                onSuccess: () => {
                    setModalOpen(false);
                    setEditingRule(null);
                },
            });
        } else {
            post('/admin/pricing', {
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

    const getRuleTypeChip = (type) => {
        switch (type) {
            case 'weekend':
                return <Chip icon={<CalendarMonthIcon fontSize="small" />} label="Weekend Surge" size="small" color="primary" sx={{ fontWeight: 600 }} />;
            case 'holiday':
                return <Chip icon={<EventIcon fontSize="small" />} label="Holiday Surge" size="small" color="warning" sx={{ fontWeight: 600 }} />;
            case 'seasonal':
                return <Chip icon={<DateRangeIcon fontSize="small" />} label="Seasonal Period" size="small" color="secondary" sx={{ fontWeight: 600 }} />;
            case 'one_way_fee':
                return <Chip icon={<AltRouteIcon fontSize="small" />} label="One-Way Relocation" size="small" color="info" sx={{ fontWeight: 600 }} />;
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
            return `₹${val.toFixed(2)} / day fixed`;
        }
        return `+₹${val.toFixed(2)} flat`;
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

    return (
        <AdminLayout title="Dynamic Pricing Rules">
            <Head title="Dynamic Pricing Rules - Admin" />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Dynamic Pricing Rules
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Configure weekend surges, national holidays, seasonal peak periods, and one-way relocation fees.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 2.5,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                    }}
                >
                    Create Pricing Rule
                </Button>
            </Box>

            {/* Metrics Strip */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Total Rules
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {stats.total ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Active Rules
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                            {stats.active ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Weekend Surges
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                            {stats.weekend ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Holiday Rates
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'warning.main' }}>
                            {stats.holiday ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Seasonal Seasons
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'secondary.main' }}>
                            {stats.seasonal ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            One-Way Fees
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'info.main' }}>
                            {stats.one_way ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Rule Category / Type"
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                handleFilterChange(e.target.value, undefined, undefined);
                            }}
                        >
                            <MenuItem value="">All Rule Types</MenuItem>
                            <MenuItem value="weekend">Weekend Surge</MenuItem>
                            <MenuItem value="holiday">Holiday Surge</MenuItem>
                            <MenuItem value="seasonal">Seasonal Period</MenuItem>
                            <MenuItem value="one_way_fee">One-Way Relocation Fee</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Vehicle Category Scope"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                handleFilterChange(undefined, e.target.value, undefined);
                            }}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Active Status"
                            value={selectedActive}
                            onChange={(e) => {
                                setSelectedActive(e.target.value);
                                handleFilterChange(undefined, undefined, e.target.value);
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="1">Active Only</MenuItem>
                            <MenuItem value="0">Inactive Only</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
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
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        No pricing rules found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Try clearing filter criteria or create a new surge or fee rule.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Create First Rule
                    </Button>
                </Paper>
            ) : viewMode === 'list' ? (
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Rule Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Target Condition / Route</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Adjustment</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Fleet Scope</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id} hover sx={{ opacity: rule.is_active ? 1 : 0.65 }}>
                                    <TableCell>{getRuleTypeChip(rule.rule_type)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {formatTargetDetails(rule)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatAdjustment(rule)}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: rule.rate_type === 'percentage' ? 'success.50' : 'info.50',
                                                color: rule.rate_type === 'percentage' ? 'success.dark' : 'info.dark',
                                                border: '1px solid',
                                                borderColor: rule.rate_type === 'percentage' ? 'success.200' : 'info.200',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {rule.bike ? (
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
                <Grid container spacing={2.5}>
                    {rules.map((rule) => (
                        <Grid item xs={12} sm={6} md={4} key={rule.id}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', opacity: rule.is_active ? 1 : 0.7 }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        {getRuleTypeChip(rule.rule_type)}
                                        <Switch
                                            size="small"
                                            checked={rule.is_active}
                                            onChange={() => handleToggleActive(rule)}
                                            color="success"
                                        />
                                    </Box>

                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                        {formatAdjustment(rule)}
                                    </Typography>

                                    <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                                            CONDITION / TARGET
                                        </Typography>
                                        <Box>{formatTargetDetails(rule)}</Box>
                                    </Box>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Scope: {rule.bike?.registration_number || rule.category?.name || 'All Fleet'}
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
                    {editingRule ? 'Edit Dynamic Pricing Rule' : 'Create Dynamic Pricing Rule'}
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {Object.keys(errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please check the form errors below.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {/* Rule Type */}
                            <Grid item xs={12}>
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
                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Applicable Day of Week"
                                        value={data.day_of_week}
                                        onChange={(e) => setData('day_of_week', Number(e.target.value))}
                                        error={Boolean(errors.day_of_week)}
                                        helperText={errors.day_of_week || 'Select the weekend day to apply surge rate.'}
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
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Holiday Date"
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
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Season Start Date"
                                            InputLabelProps={{ shrink: true }}
                                            value={data.date_start}
                                            onChange={(e) => setData('date_start', e.target.value)}
                                            error={Boolean(errors.date_start)}
                                            helperText={errors.date_start}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Season End Date"
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
                                    <Grid item xs={12} sm={6}>
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
                                    <Grid item xs={12} sm={6}>
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
                            <Grid item xs={12} sm={6}>
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
                            <Grid item xs={12} sm={6}>
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
                                            ? 'e.g. 20 for +20% surge'
                                            : 'e.g. 850 for ₹850 rate')
                                    }
                                />
                            </Grid>

                            {/* Fleet Scope: Category and Bike */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Vehicle Category Scope (Optional)"
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

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Specific Bike Scope (Optional)"
                                    value={data.bike_id}
                                    onChange={(e) => setData('bike_id', e.target.value)}
                                    error={Boolean(errors.bike_id)}
                                    helperText="Leave empty to apply fleet-wide"
                                >
                                    <MenuItem value="">All Fleet / No specific bike</MenuItem>
                                    {bikes.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.brand} {b.model_name} ({b.registration_number})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Priority & Active Switch */}
                            <Grid item xs={12} sm={6}>
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

                            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
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

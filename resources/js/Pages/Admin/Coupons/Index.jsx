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
    InputAdornment,
    Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PercentIcon from '@mui/icons-material/Percent';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

export default function CouponsIndex({
    coupons = [],
    discount_types = [],
    stats = {},
    filters = {},
}) {
    const [searchCode, setSearchCode] = useState(filters.code || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [viewMode, setViewMode] = useState('list');
    const [copiedCode, setCopiedCode] = useState(null);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Delete dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCoupon, setDeletingCoupon] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        discount_type: 'percentage',
        value: '',
        max_uses_total: '',
        max_uses_per_user: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
    });

    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/coupons',
            {
                code: searchCode,
                status: selectedStatus,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleOpenCreate = () => {
        reset();
        clearErrors();
        setData({
            code: '',
            discount_type: 'percentage',
            value: '',
            max_uses_total: '',
            max_uses_per_user: '',
            valid_from: new Date().toISOString().split('T')[0],
            valid_until: '',
            is_active: true,
        });
        setEditingCoupon(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (coupon) => {
        clearErrors();
        setEditingCoupon(coupon);
        setData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            value: coupon.value,
            max_uses_total: coupon.max_uses_total ?? '',
            max_uses_per_user: coupon.max_uses_per_user ?? '',
            valid_from: coupon.valid_from || '',
            valid_until: coupon.valid_until || '',
            is_active: coupon.is_active,
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCoupon) {
            put(`/admin/coupons/${editingCoupon.id}`, {
                onSuccess: () => {
                    setModalOpen(false);
                    setEditingCoupon(null);
                },
            });
        } else {
            post('/admin/coupons', {
                onSuccess: () => {
                    setModalOpen(false);
                },
            });
        }
    };

    const handleToggleActive = (coupon) => {
        router.post(`/admin/coupons/${coupon.id}/toggle`, {}, { preserveScroll: true });
    };

    const handleConfirmDelete = () => {
        if (!deletingCoupon) return;
        router.delete(`/admin/coupons/${deletingCoupon.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingCoupon(null);
            },
        });
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
    };

    const formatDiscountBadge = (coupon) => {
        const val = Number(coupon.value);
        if (coupon.discount_type === 'percentage') {
            return `${val}% OFF`;
        }
        return `₹${val.toFixed(2)} OFF`;
    };

    const getValidityStatusChip = (coupon) => {
        if (coupon.is_expired) {
            return <Chip label="Expired" size="small" color="error" variant="outlined" sx={{ fontWeight: 600 }} />;
        }
        if (coupon.is_upcoming) {
            return <Chip label="Upcoming" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />;
        }
        return <Chip label="Active Window" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />;
    };

    return (
        <AdminLayout title="Discount Coupons">
            <Head title="Discount Coupons - Admin" />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Discount Coupons
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Create promotional promo codes, manage percentage discounts, and enforce total and per-customer usage caps.
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
                    Create Coupon
                </Button>
            </Box>

            {/* Metrics Strip */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Total Coupons
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {stats.total ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Active Promos
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                            {stats.active ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Total Redemptions
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                            {stats.total_redemptions ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Expired Promos
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'text.secondary' }}>
                            {stats.expired ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filter & Search Bar */}
            <Paper component="form" onSubmit={handleFilterSubmit} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search coupon code (e.g. MONSOON20)..."
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Validity & Status"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                router.get(
                                    '/admin/coupons',
                                    { code: searchCode, status: e.target.value },
                                    { preserveState: true, replace: true }
                                );
                            }}
                        >
                            <MenuItem value="">All Coupons</MenuItem>
                            <MenuItem value="active">Active & Valid Window</MenuItem>
                            <MenuItem value="inactive">Inactive / Paused</MenuItem>
                            <MenuItem value="expired">Expired Date Window</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5 }}>
                        <Button type="submit" variant="outlined" sx={{ textTransform: 'none' }}>
                            Search
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

            {/* Coupons List or Grid */}
            {coupons.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <ConfirmationNumberIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        No coupons found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Try clearing search terms or create your first promotional coupon.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Create Promo Coupon
                    </Button>
                </Paper>
            ) : viewMode === 'list' ? (
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 840 }}>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Coupon Code</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Discount</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Validity Window</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Usage Limits</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {coupons.map((coupon) => (
                                <TableRow key={coupon.id} hover sx={{ opacity: coupon.is_active && !coupon.is_expired ? 1 : 0.65 }}>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label={coupon.code}
                                                size="medium"
                                                color="primary"
                                                variant="outlined"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem',
                                                    letterSpacing: '0.05em',
                                                }}
                                            />
                                            <Tooltip title="Copy code">
                                                <IconButton size="small" onClick={() => copyToClipboard(coupon.code)}>
                                                    <ContentCopyIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatDiscountBadge(coupon)}
                                            size="small"
                                            color={coupon.discount_type === 'percentage' ? 'success' : 'info'}
                                            variant="outlined"
                                            sx={{ fontWeight: 800 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {coupon.valid_from} → {coupon.valid_until}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>{getValidityStatusChip(coupon)}</Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {coupon.usages_count} redeemed
                                            {coupon.max_uses_total ? ` / ${coupon.max_uses_total} max` : ' (no cap)'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {coupon.max_uses_per_user ? `Max ${coupon.max_uses_per_user} per user` : 'Unlimited per user'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            size="small"
                                            checked={coupon.is_active}
                                            onChange={() => handleToggleActive(coupon)}
                                            color="success"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(coupon)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setDeletingCoupon(coupon);
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
                    {coupons.map((coupon) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={coupon.id}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', opacity: coupon.is_active && !coupon.is_expired ? 1 : 0.7 }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label={coupon.code}
                                                size="medium"
                                                color="primary"
                                                variant="outlined"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 800,
                                                }}
                                            />
                                            <Tooltip title="Copy code">
                                                <IconButton size="small" onClick={() => copyToClipboard(coupon.code)}>
                                                    <ContentCopyIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <Switch
                                            size="small"
                                            checked={coupon.is_active}
                                            onChange={() => handleToggleActive(coupon)}
                                            color="success"
                                        />
                                    </Box>

                                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                                        {formatDiscountBadge(coupon)}
                                    </Typography>

                                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                                            VALIDITY WINDOW
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {coupon.valid_from} to {coupon.valid_until}
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>{getValidityStatusChip(coupon)}</Box>
                                    </Box>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                                                REDEMPTIONS
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {coupon.usages_count} / {coupon.max_uses_total || '∞'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                                                PER USER CAP
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {coupon.max_uses_per_user || 'Unlimited'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon fontSize="small" />}
                                            onClick={() => handleOpenEdit(coupon)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon fontSize="small" />}
                                            onClick={() => {
                                                setDeletingCoupon(coupon);
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

            {/* Create / Edit Coupon Dialog */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Coupon'}
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {Object.keys(errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please review the errors below before submitting.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {/* Code */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Coupon Code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    error={Boolean(errors.code)}
                                    helperText={errors.code || 'Uppercase alphanumeric promo code (e.g. FESTIVE20)'}
                                    slotProps={{
                                        htmlInput: { style: { fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' } },
                                    }}
                                    inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' } }}
                                />
                            </Grid>

                            {/* Discount Type and Value */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Discount Type"
                                    value={data.discount_type}
                                    onChange={(e) => setData('discount_type', e.target.value)}
                                    error={Boolean(errors.discount_type)}
                                    helperText={errors.discount_type}
                                >
                                    {discount_types.map((dt) => (
                                        <MenuItem key={dt.value} value={dt.value}>
                                            {dt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Discount Value"
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    error={Boolean(errors.value)}
                                    helperText={
                                        errors.value ||
                                        (data.discount_type === 'percentage'
                                            ? 'e.g. 15 for 15% discount'
                                            : 'e.g. 250 for ₹250 flat discount')
                                    }
                                />
                            </Grid>

                            {/* Validity Dates */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Valid From"
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    InputLabelProps={{ shrink: true }}
                                    value={data.valid_from}
                                    onChange={(e) => setData('valid_from', e.target.value)}
                                    error={Boolean(errors.valid_from)}
                                    helperText={errors.valid_from}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Valid Until"
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    InputLabelProps={{ shrink: true }}
                                    value={data.valid_until}
                                    onChange={(e) => setData('valid_until', e.target.value)}
                                    error={Boolean(errors.valid_until)}
                                    helperText={errors.valid_until}
                                />
                            </Grid>

                            {/* Usage Limits */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Total Usage Limit (Optional)"
                                    value={data.max_uses_total}
                                    onChange={(e) => setData('max_uses_total', e.target.value)}
                                    error={Boolean(errors.max_uses_total)}
                                    helperText="Max times this coupon can ever be used fleet-wide"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Per User Limit (Optional)"
                                    value={data.max_uses_per_user}
                                    onChange={(e) => setData('max_uses_per_user', e.target.value)}
                                    error={Boolean(errors.max_uses_per_user)}
                                    helperText="Max redemptions allowed per customer account"
                                />
                            </Grid>

                            {/* Active Switch */}
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            color="success"
                                        />
                                    }
                                    label="Coupon Active and Redeemable immediately"
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
                            {processing ? <CircularProgress size={20} color="inherit" /> : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Deletion Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Coupon Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete coupon code <strong>{deletingCoupon?.code}</strong>? This action cannot be undone and will prevent customers from redeeming it.
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
                        Delete Coupon
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Copy code notification */}
            <Snackbar
                open={Boolean(copiedCode)}
                autoHideDuration={2000}
                onClose={() => setCopiedCode(null)}
                message={`Copied ${copiedCode} to clipboard`}
            />
        </AdminLayout>
    );
}

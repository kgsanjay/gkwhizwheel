import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
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
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    Divider,
    IconButton,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VerifiedIcon from '@mui/icons-material/Verified';

export default function BikesIndex({
    bikes = [],
    categories = [],
    stores = [],
    filters = {},
    stats = {},
}) {
    const [viewMode, setViewMode] = useState('list');
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [storeId, setStoreId] = useState(filters.store_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [driftOnly, setDriftOnly] = useState(Boolean(filters.drift));

    // Import modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');

    // Delete confirmation state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bikeToDelete, setBikeToDelete] = useState(null);

    const applyFilters = (newFilters = {}) => {
        const query = {
            search,
            category_id: categoryId,
            store_id: storeId,
            status,
            drift: driftOnly ? '1' : undefined,
            ...newFilters,
        };

        // Strip empty values
        Object.keys(query).forEach((k) => {
            if (!query[k]) delete query[k];
        });

        router.get('/admin/bikes', query, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const handleDriftToggle = () => {
        const nextDrift = !driftOnly;
        setDriftOnly(nextDrift);
        applyFilters({ drift: nextDrift ? '1' : undefined });
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        if (!importFile) {
            setImportError('Please select a valid CSV file.');
            return;
        }

        setIsImporting(true);
        setImportError('');

        const formData = new FormData();
        formData.append('file', importFile);

        router.post('/admin/bikes/import-csv', formData, {
            onSuccess: () => {
                setImportModalOpen(false);
                setImportFile(null);
                setIsImporting(false);
            },
            onError: (err) => {
                setImportError(err.file || 'Failed to import CSV.');
                setIsImporting(false);
            },
        });
    };

    const confirmDelete = () => {
        if (!bikeToDelete) return;
        router.delete(`/admin/bikes/${bikeToDelete.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setBikeToDelete(null);
            },
        });
    };

    const getStatusChip = (bikeStatus) => {
        switch (bikeStatus) {
            case 'available':
                return <Chip label="Available" color="success" size="small" sx={{ fontWeight: 700 }} />;
            case 'rented':
                return <Chip label="On Road" color="primary" size="small" sx={{ fontWeight: 700 }} />;
            case 'in_service':
                return <Chip label="In Service" color="warning" size="small" sx={{ fontWeight: 700 }} />;
            case 'reserved':
                return <Chip label="Reserved" color="info" size="small" sx={{ fontWeight: 700 }} />;
            case 'retired':
                return <Chip label="Retired" size="small" sx={{ fontWeight: 700, bgcolor: 'grey.300' }} />;
            default:
                return <Chip label={bikeStatus} size="small" sx={{ fontWeight: 700 }} />;
        }
    };

    const renderDocumentStatus = (docs) => {
        const items = [
            { label: 'RC', doc: docs?.rc },
            { label: 'INS', doc: docs?.insurance },
            { label: 'PUC', doc: docs?.emission },
        ];

        return (
            <Stack direction="row" spacing={0.5}>
                {items.map((item) => {
                    const isPresent = Boolean(item.doc);
                    return (
                        <Tooltip
                            key={item.label}
                            title={
                                isPresent
                                    ? `${item.label}: Expiry ${item.doc.expiry_date || 'N/A'}`
                                    : `${item.label} Missing`
                            }
                        >
                            <Chip
                                label={item.label}
                                size="small"
                                color={isPresent ? 'success' : 'default'}
                                variant={isPresent ? 'filled' : 'outlined'}
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    px: 0.2,
                                    opacity: isPresent ? 1 : 0.45,
                                }}
                            />
                        </Tooltip>
                    );
                })}
            </Stack>
        );
    };

    return (
        <AdminLayout title="Fleet Inventory">
            <Head title="Fleet Inventory - GkWhizWheel Admin" />

            {/* Page Header */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Fleet Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Manage vehicle profiles, regulatory documents, live hub tracking, and bulk onboarding.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<UploadFileIcon />}
                        onClick={() => setImportModalOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Bulk CSV Import
                    </Button>
                    <Button
                        component={Link}
                        href="/admin/bikes/create"
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                        Add New Bike
                    </Button>
                </Stack>
            </Box>

            {/* Fleet Statistics Bar */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, borderRadius: 2.5, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                            Total Fleet
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                            {stats.total ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, borderRadius: 2.5, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, textTransform: 'uppercase' }}>
                            Available
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                            {stats.available ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, borderRadius: 2.5, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase' }}>
                            On Road (Rented)
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                            {stats.rented ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, borderRadius: 2.5, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, textTransform: 'uppercase' }}>
                            Maintenance
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.main', mt: 0.5 }}>
                            {stats.in_service ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper
                        onClick={handleDriftToggle}
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: driftOnly ? 'warning.main' : 'divider',
                            bgcolor: driftOnly ? 'warning.50' : 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                            Drifted Hubs {driftOnly && '●'}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.dark', mt: 0.5 }}>
                            {stats.drifted ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filter and View Toggle Controls */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Search Field */}
                    <Grid item xs={12} md={3.5}>
                        <Box component="form" onSubmit={handleSearchSubmit}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search model, brand, registration..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </Grid>

                    {/* Category Filter */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Category"
                            value={categoryId}
                            onChange={(e) => {
                                setCategoryId(e.target.value);
                                applyFilters({ category_id: e.target.value });
                            }}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Store Filter */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Hub Location"
                            value={storeId}
                            onChange={(e) => {
                                setStoreId(e.target.value);
                                applyFilters({ store_id: e.target.value });
                            }}
                        >
                            <MenuItem value="">All Hubs</MenuItem>
                            {stores.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Status Filter */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Status"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="available">Available</MenuItem>
                            <MenuItem value="rented">On Road</MenuItem>
                            <MenuItem value="in_service">In Service</MenuItem>
                            <MenuItem value="reserved">Reserved</MenuItem>
                            <MenuItem value="retired">Retired</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Drift Filter Toggle & View Switcher */}
                    <Grid item xs={6} sm={3} md={2.5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            variant={driftOnly ? 'contained' : 'outlined'}
                            color="warning"
                            size="small"
                            onClick={handleDriftToggle}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                        >
                            {driftOnly ? 'Showing Drifted' : 'Filter Drifted'}
                        </Button>

                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(e, val) => val && setViewMode(val)}
                            size="small"
                        >
                            <ToggleButton value="list" aria-label="list view">
                                <ViewListIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="grid" aria-label="grid view">
                                <ViewModuleIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>

            {/* Main Content: List View or Grid View */}
            {viewMode === 'list' ? (
                /* Table View */
                <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="medium">
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>VEHICLE</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>REGISTRATION</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>CURRENT HUB</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>SPECS & RATES</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>DOCUMENTS</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>STATUS</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bikes.length > 0 ? (
                                    bikes.map((bike) => (
                                        <TableRow key={bike.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {bike.primary_image_url ? (
                                                        <Box
                                                            component="img"
                                                            src={bike.primary_image_url}
                                                            alt={bike.model_name}
                                                            sx={{ width: 48, height: 48, borderRadius: 2, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'divider' }}>
                                                            <TwoWheelerIcon sx={{ color: 'text.disabled' }} />
                                                        </Box>
                                                    )}
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            {bike.brand} {bike.model_name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {bike.category?.name}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={bike.registration_number}
                                                    size="small"
                                                    sx={{ fontWeight: 700, bgcolor: 'primary.50', color: 'primary.dark' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {bike.current_store?.name || 'Unassigned'}
                                                </Typography>
                                                {bike.is_drifted && (
                                                    <Chip
                                                        icon={<WarningAmberIcon sx={{ fontSize: '0.9rem !important' }} />}
                                                        label={`Home: ${bike.home_store?.code}`}
                                                        color="warning"
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, mt: 0.5 }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    ₹{bike.base_daily_rate} / day
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Deposit: ₹{bike.deposit_amount} • {bike.odometer_reading} km
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {renderDocumentStatus(bike.documents)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(bike.status)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <IconButton
                                                        component={Link}
                                                        href={`/admin/bikes/${bike.id}/edit`}
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setBikeToDelete(bike);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                No bikes found matching your criteria.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            ) : (
                /* Card Grid View */
                <Grid container spacing={3}>
                    {bikes.length > 0 ? (
                        bikes.map((bike) => (
                            <Grid item xs={12} sm={6} md={4} key={bike.id}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {bike.primary_image_url ? (
                                        <CardMedia
                                            component="img"
                                            height="180"
                                            image={bike.primary_image_url}
                                            alt={bike.model_name}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Box sx={{ height: 180, bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <TwoWheelerIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                                        </Box>
                                    )}

                                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                    {bike.brand} {bike.model_name}
                                                </Typography>
                                                <Chip
                                                    label={bike.registration_number}
                                                    size="small"
                                                    sx={{ fontWeight: 700, mt: 0.5, bgcolor: 'primary.50', color: 'primary.dark' }}
                                                />
                                            </Box>
                                            {getStatusChip(bike.status)}
                                        </Box>

                                        <Divider sx={{ my: 1.5 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Location:</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {bike.current_store?.name}
                                            </Typography>
                                        </Box>

                                        {bike.is_drifted && (
                                            <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{ py: 0.2, px: 1, mb: 1, borderRadius: 1.5, fontSize: '0.75rem' }}>
                                                Drifted from home hub ({bike.home_store?.name})
                                            </Alert>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Daily Rate:</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                ₹{bike.base_daily_rate}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Compliance Docs:</Typography>
                                            {renderDocumentStatus(bike.documents)}
                                        </Box>

                                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                            <Button
                                                component={Link}
                                                href={`/admin/bikes/${bike.id}/edit`}
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                startIcon={<EditIcon />}
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Edit
                                            </Button>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setBikeToDelete(bike);
                                                    setDeleteModalOpen(true);
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    No bikes found matching your criteria.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Bulk CSV Import Dialog Modal */}
            <Dialog
                open={importModalOpen}
                onClose={() => !isImporting && setImportModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Bulk Fleet Onboarding via CSV
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setImportModalOpen(false)}
                        disabled={isImporting}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    {importError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {importError}
                        </Alert>
                    )}

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Upload a CSV file containing bike specifications, registration numbers, hub assignments, and pricing.
                    </Typography>

                    {/* Dropzone */}
                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: importFile ? 'primary.main' : 'divider',
                            borderRadius: 3,
                            p: 4,
                            textAlign: 'center',
                            bgcolor: importFile ? 'primary.50' : 'background.default',
                            cursor: 'pointer',
                            mb: 2.5,
                        }}
                        component="label"
                    >
                        <input
                            type="file"
                            hidden
                            accept=".csv,text/csv"
                            onChange={(e) => {
                                setImportFile(e.target.files[0] || null);
                                setImportError('');
                            }}
                            disabled={isImporting}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: importFile ? 'primary.main' : 'text.disabled', mb: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {importFile ? importFile.name : 'Click to select or drop CSV file here'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'CSV format required with standard column headers'}
                        </Typography>
                    </Box>

                    {/* Download Sample CSV Action */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Standard CSV Template
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Pre-formatted with required headers and demo rows
                            </Typography>
                        </Box>
                        <Button
                            href="/admin/bikes/export-sample-csv"
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                        >
                            Download Sample
                        </Button>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setImportModalOpen(false)} disabled={isImporting} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleImportSubmit}
                        disabled={!importFile || isImporting}
                        startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
                        sx={{ textTransform: 'none', fontWeight: 700, px: 3, borderRadius: 2 }}
                    >
                        {isImporting ? 'Processing Import...' : 'Import Bikes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Decommission</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to remove <strong>{bikeToDelete?.brand} {bikeToDelete?.model_name}</strong> ({bikeToDelete?.registration_number}) from the fleet inventory?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Confirm Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

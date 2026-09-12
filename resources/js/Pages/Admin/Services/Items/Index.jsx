import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    IconButton,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import BlockIcon from '@mui/icons-material/Block';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import GroupsIcon from '@mui/icons-material/Groups';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';

export default function ServiceItemsIndex({
    serviceConfig = {},
    items = { data: [] },
    filters = {},
    stats = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            `/admin/services/${serviceConfig.slug}/items`,
            { search, status },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusFilter = (newStatus) => {
        setStatus(newStatus);
        router.get(
            `/admin/services/${serviceConfig.slug}/items`,
            { search, status: newStatus },
            { preserveState: true, replace: true }
        );
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        router.delete(
            `/admin/services/${serviceConfig.slug}/items/${itemToDelete.id}`,
            {
                onSuccess: () => setDeleteModalOpen(false),
            }
        );
    };

    const getStatusChip = (st) => {
        switch (st) {
            case 'available':
                return <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Available" color="success" sx={{ fontWeight: 700 }} />;
            case 'maintenance':
                return <Chip size="small" icon={<BuildIcon sx={{ fontSize: 14 }} />} label="Maintenance" color="warning" sx={{ fontWeight: 700 }} />;
            case 'booked':
                return <Chip size="small" label="Booked / Reserved" color="info" sx={{ fontWeight: 700 }} />;
            default:
                return <Chip size="small" icon={<BlockIcon sx={{ fontSize: 14 }} />} label="Inactive" color="default" sx={{ fontWeight: 600 }} />;
        }
    };

    const formatPriceUnit = (unit) => {
        return (unit || '').replace('_', ' ').toUpperCase();
    };

    return (
        <AdminLayout title={`${serviceConfig.title} - Fleet & Inventory`}>
            <Head title={`${serviceConfig.title} Inventory - Admin`} />

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header Title & Actions */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {serviceConfig.title} Inventory
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Manage vehicles, equipment, packages, and availability for {serviceConfig.title.toLowerCase()}.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            component={Link}
                            href={`/admin/services/categories?service_type=${serviceConfig.slug}`}
                            startIcon={<CategoryIcon />}
                            sx={{ fontWeight: 700, textTransform: 'none' }}
                        >
                            Categories
                        </Button>
                        <Button
                            variant="outlined"
                            component={Link}
                            href={`/admin/services/${serviceConfig.slug}/bookings`}
                            startIcon={<ReceiptLongIcon />}
                            sx={{ fontWeight: 700, textTransform: 'none' }}
                        >
                            View Bookings
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            component={Link}
                            href={`/admin/services/${serviceConfig.slug}/items/create`}
                            startIcon={<AddIcon />}
                            sx={{ fontWeight: 800, textTransform: 'none', px: 2.5 }}
                        >
                            Add {serviceConfig.item_label}
                        </Button>
                    </Stack>
                </Box>

                {/* Stats Highlights */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <Card sx={{ flex: 1, minWidth: 160, borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                Total {serviceConfig.item_label}s
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>
                                {stats.total || 0}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ flex: 1, minWidth: 160, borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                Active & Available
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>
                                {stats.available || 0}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ flex: 1, minWidth: 160, borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                In Service / Inactive
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'error.main' }}>
                                {stats.maintenance || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Search & Filter Bar */}
                <Card sx={{ mb: 3, p: 2, borderRadius: 2.5 }}>
                    <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder={`Search ${serviceConfig.item_label.toLowerCase()} name, category...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 220 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            select
                            size="small"
                            value={status}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            sx={{ width: { xs: '100%', sm: 180 } }}
                            label="Filter Status"
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="available">Available Only</MenuItem>
                            <MenuItem value="maintenance">Maintenance</MenuItem>
                            <MenuItem value="booked">Booked</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </TextField>

                        <Button type="submit" variant="contained" sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}>
                            Filter
                        </Button>
                    </Box>
                </Card>

                {/* Inventory Data Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Item</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Category / Type</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Base Tariff</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Capacity</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Features & Badge</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.data && items.data.length > 0 ? (
                                items.data.map((item) => (
                                    <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                {item.image_url ? (
                                                    <Box
                                                        component="img"
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        sx={{ width: 52, height: 42, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
                                                    />
                                                ) : (
                                                    <Box sx={{ width: 52, height: 42, borderRadius: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', fontSize: '0.7rem' }}>
                                                        No Image
                                                    </Box>
                                                )}
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 280 }}>
                                                        {item.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {item.category || 'General'}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'success.main' }}>
                                                ₹{parseFloat(item.price_base).toLocaleString('en-IN')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                {formatPriceUnit(item.price_unit)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <GroupsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.capacity || '—'}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                                {item.badge && (
                                                    <Chip size="small" label={item.badge} sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 700, fontSize: '0.7rem' }} />
                                                )}
                                                {item.features && item.features.slice(0, 2).map((f, idx) => (
                                                    <Chip key={idx} size="small" variant="outlined" label={f} sx={{ fontSize: '0.68rem' }} />
                                                ))}
                                                {item.features && item.features.length > 2 && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                                                        +{item.features.length - 2} more
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            {getStatusChip(item.status)}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <Tooltip title="Edit Item Details">
                                                    <IconButton
                                                        size="small"
                                                        component={Link}
                                                        href={`/admin/services/${serviceConfig.slug}/items/${item.id}/edit`}
                                                        color="primary"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Item">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => confirmDelete(item)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                            No {serviceConfig.item_label.toLowerCase()}s found matching current filters.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            component={Link}
                                            href={`/admin/services/${serviceConfig.slug}/items/create`}
                                            startIcon={<AddIcon />}
                                            sx={{ mt: 2, fontWeight: 700, textTransform: 'none' }}
                                        >
                                            Add First {serviceConfig.item_label}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Item Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? Existing historical bookings will preserve their records, but this item won't be available for new bookings.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ fontWeight: 700, textTransform: 'none' }}>
                        Yes, Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

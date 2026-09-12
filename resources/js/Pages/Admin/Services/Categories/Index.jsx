import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Alert,
    Tabs,
    Tab,
    MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/ScubaDiving';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import TourIcon from '@mui/icons-material/Tour';

const SERVICE_ICONS = {
    two_wheelers: <TwoWheelerIcon fontSize="small" />,
    taxi: <LocalTaxiIcon fontSize="small" />,
    boating: <DirectionsBoatIcon fontSize="small" />,
    scuba: <ScubaDivingIcon fontSize="small" />,
    homestay: <HomeWorkIcon fontSize="small" />,
    guide: <ExploreIcon fontSize="small" />,
    tours: <TourIcon fontSize="small" />,
};

export default function ServiceCategoriesIndex({
    categories = [],
    activeServiceType = 'two_wheelers',
    activeServiceConfig = {},
    serviceConfigs = {},
    availableServices = [],
    serviceCategoryCounts = {},
}) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const addForm = useForm({
        service_type: activeServiceType,
        name: '',
        sort_order: categories.length + 1,
    });

    const editForm = useForm({
        name: '',
        sort_order: 0,
    });

    const handleTabChange = (event, newValue) => {
        router.get(
            '/admin/services/categories',
            { service_type: newValue },
            { preserveState: true }
        );
    };

    const openAddModal = () => {
        addForm.setData({
            service_type: activeServiceType,
            name: '',
            sort_order: categories.length + 1,
        });
        addForm.clearErrors();
        setAddModalOpen(true);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        addForm.post('/admin/services/categories', {
            preserveScroll: true,
            onSuccess: () => {
                setAddModalOpen(false);
                addForm.reset();
            },
        });
    };

    const openEditModal = (cat) => {
        setCategoryToEdit(cat);
        editForm.setData({
            name: cat.name,
            sort_order: cat.sort_order,
        });
        editForm.clearErrors();
        setEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!categoryToEdit) return;
        editForm.put(`/admin/services/categories/${categoryToEdit.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditModalOpen(false);
                setCategoryToEdit(null);
            },
        });
    };

    const openDeleteModal = (cat) => {
        setCategoryToDelete(cat);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!categoryToDelete) return;
        router.delete(`/admin/services/categories/${categoryToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
            },
        });
    };

    return (
        <AdminLayout title="Service Categories Management">
            <Head title="Service Categories - Admin" />

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header Title & Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { sm: 'center' },
                        gap: 2,
                        mb: 3,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: 'text.primary',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <CategoryIcon color="primary" /> Service Categories
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Manage category taxonomies across all services so staff can organize fleet and packages dynamically.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            component={Link}
                            href={`/admin/services/${activeServiceType}/items`}
                            startIcon={<Inventory2Icon />}
                            sx={{ fontWeight: 700, textTransform: 'none' }}
                        >
                            View {activeServiceConfig?.title || 'Service'} Inventory
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={openAddModal}
                            startIcon={<AddIcon />}
                            sx={{ fontWeight: 800, textTransform: 'none', px: 2.5 }}
                        >
                            Add Category
                        </Button>
                    </Stack>
                </Box>

                {/* Service Type Selection Tabs */}
                <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                    <Tabs
                        value={activeServiceType}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                textTransform: 'none',
                                minHeight: 52,
                                fontSize: '0.9rem',
                            },
                        }}
                    >
                        {availableServices.map((slug) => {
                            const config = serviceConfigs[slug] || {};
                            const count = serviceCategoryCounts[slug] || 0;
                            return (
                                <Tab
                                    key={slug}
                                    value={slug}
                                    icon={SERVICE_ICONS[slug] || <CategoryIcon fontSize="small" />}
                                    iconPosition="start"
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span>{config.title || slug}</span>
                                            <Chip
                                                label={count}
                                                size="small"
                                                color={slug === activeServiceType ? 'primary' : 'default'}
                                                sx={{ height: 20, fontSize: '0.72rem', fontWeight: 800 }}
                                            />
                                        </Box>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                </Paper>

                {/* Categories Table Card */}
                <Card sx={{ borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} elevation={0}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, width: 80 }}>Sort</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Category Name</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Service</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Items Assigned</TableCell>
                                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                                                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                    No categories configured for {activeServiceConfig?.title || activeServiceType}.
                                                </Typography>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={openAddModal}
                                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                                                >
                                                    Add First Category
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((cat) => (
                                            <TableRow key={cat.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell>
                                                    <Chip
                                                        label={`#${cat.sort_order}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                        {cat.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={activeServiceConfig?.title || cat.service_type}
                                                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={`${cat.items_count || 0} items`}
                                                        color={(cat.items_count || 0) > 0 ? 'info' : 'default'}
                                                        variant="filled"
                                                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'right' }}>
                                                    <Tooltip title="Edit Category">
                                                        <IconButton size="small" color="primary" onClick={() => openEditModal(cat)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Category">
                                                        <IconButton size="small" color="error" onClick={() => openDeleteModal(cat)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>

            {/* Add Category Dialog */}
            <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
                <Box component="form" onSubmit={handleAddSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Add New Service Category</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                select
                                label="Service Type"
                                fullWidth
                                value={addForm.data.service_type}
                                onChange={(e) => addForm.setData('service_type', e.target.value)}
                                error={Boolean(addForm.errors.service_type)}
                                helperText={addForm.errors.service_type}
                            >
                                {availableServices.map((slug) => (
                                    <MenuItem key={slug} value={slug}>
                                        {serviceConfigs[slug]?.title || slug}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Category Name"
                                required
                                fullWidth
                                value={addForm.data.name}
                                onChange={(e) => addForm.setData('name', e.target.value)}
                                error={Boolean(addForm.errors.name)}
                                helperText={addForm.errors.name || 'e.g. 7-Seater Luxury SUV, Coastal River Cottage'}
                            />

                            <TextField
                                label="Display Sort Order"
                                type="number"
                                fullWidth
                                value={addForm.data.sort_order}
                                onChange={(e) => addForm.setData('sort_order', parseInt(e.target.value, 10) || 0)}
                                error={Boolean(addForm.errors.sort_order)}
                                helperText="Lower numbers appear first in selector chips and lists."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setAddModalOpen(false)} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={addForm.processing}
                            sx={{ fontWeight: 800, textTransform: 'none', px: 3 }}
                        >
                            Save Category
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
                <Box component="form" onSubmit={handleEditSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Edit Service Category</DialogTitle>
                    <DialogContent dividers>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Renaming this category will also automatically update all existing inventory items assigned to it.
                        </Alert>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Category Name"
                                required
                                fullWidth
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                error={Boolean(editForm.errors.name)}
                                helperText={editForm.errors.name}
                            />

                            <TextField
                                label="Display Sort Order"
                                type="number"
                                fullWidth
                                value={editForm.data.sort_order}
                                onChange={(e) => editForm.setData('sort_order', parseInt(e.target.value, 10) || 0)}
                                error={Boolean(editForm.errors.sort_order)}
                                helperText="Lower numbers appear first in selector chips and lists."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={editForm.processing}
                            sx={{ fontWeight: 800, textTransform: 'none', px: 3 }}
                        >
                            Update Category
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Delete Category</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete category <strong>&quot;{categoryToDelete?.name}&quot;</strong>?
                    </Typography>
                    {(categoryToDelete?.items_count || 0) > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Notice: There are currently {categoryToDelete.items_count} inventory item(s) using this category.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 800, textTransform: 'none' }}>
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

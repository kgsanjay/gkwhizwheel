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
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    InputAdornment,
    Select,
    InputLabel,
    FormControl,
    OutlinedInput,
    Checkbox,
    ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';

const SERVICE_OPTIONS = [
    { slug: 'two_wheelers', name: 'Two-Wheelers & Bikes', short: 'Bikes' },
    { slug: 'taxi', name: 'Cabs & Taxi', short: 'Taxi' },
    { slug: 'boating', name: 'Boating & Water Sports', short: 'Boating' },
    { slug: 'scuba', name: 'Scuba Diving & Snorkeling', short: 'Scuba' },
    { slug: 'homestay', name: 'Homestays & Resorts', short: 'Stays' },
    { slug: 'guide', name: 'Local Tour Guides', short: 'Guides' },
    { slug: 'tours', name: 'Custom Packages & Tours', short: 'Tours' },
];

export default function StaffIndex({
    staff = [],
    stores = [],
    stats = {},
    filters = {},
    roles = [],
    available_services = [],
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedStore, setSelectedStore] = useState(filters.store_id || '');

    // Create Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    // Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingStaff, setDeletingStaff] = useState(null);

    // Create form
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        store_ids: [],
        services: ['two_wheelers'],
    });

    // Edit form
    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        status: 'active',
        password: '',
        store_ids: [],
        services: [],
    });

    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/staff',
            { search, role: selectedRole, store_id: selectedStore },
            { preserveState: true, replace: true }
        );
    };

    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        createForm.setData({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'staff',
            store_ids: [],
            services: ['two_wheelers'],
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/admin/staff', {
            onSuccess: () => {
                setCreateModalOpen(false);
            },
        });
    };

    const handleOpenEdit = (user) => {
        editForm.clearErrors();
        setEditingStaff(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            password: '',
            store_ids: user.stores ? user.stores.map((s) => s.id) : [],
            services: user.services && user.services.length > 0 ? user.services : ['two_wheelers'],
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingStaff) return;
        editForm.put(`/admin/staff/${editingStaff.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingStaff(null);
            },
        });
    };

    const handleConfirmDelete = () => {
        if (!deletingStaff) return;
        router.delete(`/admin/staff/${deletingStaff.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingStaff(null);
            },
        });
    };

    const getRoleChip = (role) => {
        if (role === 'store_manager') {
            return <Chip icon={<SupervisorAccountIcon fontSize="small" />} label="Store Manager" size="small" color="warning" sx={{ fontWeight: 700 }} />;
        }
        return <Chip icon={<PersonIcon fontSize="small" />} label="Store Staff" size="small" color="info" sx={{ fontWeight: 600 }} />;
    };

    return (
        <AdminLayout title="Staff Management">
            <Head title="Staff Management - Admin" />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Staff & Store Managers
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Create store personnel, manage operational roles, and assign team members across multiple store locations.
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
                    Add Staff Member
                </Button>
            </Box>

            {/* Metrics Strip */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Total Personnel
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {stats.total ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Store Managers
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'warning.main' }}>
                            {stats.managers ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Operations Staff
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'info.main' }}>
                            {stats.staff ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Active Accounts
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                            {stats.active ?? 0}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <Paper component="form" onSubmit={handleFilterSubmit} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by staff name, email, or phone..."
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
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Role Filter"
                            value={selectedRole}
                            onChange={(e) => {
                                setSelectedRole(e.target.value);
                                router.get('/admin/staff', { search, role: e.target.value, store_id: selectedStore }, { preserveState: true, replace: true });
                            }}
                        >
                            <MenuItem value="">All Roles</MenuItem>
                            <MenuItem value="store_manager">Store Managers</MenuItem>
                            <MenuItem value="staff">Store Staff</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Assigned Store Hub"
                            value={selectedStore}
                            onChange={(e) => {
                                setSelectedStore(e.target.value);
                                router.get('/admin/staff', { search, role: selectedRole, store_id: e.target.value }, { preserveState: true, replace: true });
                            }}
                        >
                            <MenuItem value="">All Store Hubs</MenuItem>
                            {stores.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name} ({s.city})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="outlined" sx={{ textTransform: 'none', height: 40, width: '100%' }}>
                            Filter
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Staff Data Table */}
            {staff.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <BadgeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        No staff members found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Try clearing search terms or add a new staff or store manager account.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Add Staff Member
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 980 }}>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Assigned Store Hubs</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Assigned Services</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Account Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {staff.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontWeight: 700, fontSize: '0.85rem' }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    {user.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: #{user.id}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{getRoleChip(user.role)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.email}</Typography>
                                        <Typography variant="caption" color="text.secondary">{user.phone}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {user.stores && user.stores.length > 0 ? (
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                                                {user.stores.map((s) => (
                                                    <Chip
                                                        key={s.id}
                                                        icon={<StoreIcon fontSize="small" />}
                                                        label={s.name}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Chip label="Unassigned" size="small" color="default" sx={{ fontStyle: 'italic' }} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.services && user.services.length === SERVICE_OPTIONS.length ? (
                                            <Chip
                                                label="All Services (7)"
                                                size="small"
                                                color="primary"
                                                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                            />
                                        ) : user.services && user.services.length > 0 ? (
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5, maxWidth: 220 }}>
                                                {user.services.map((slug) => {
                                                    const srv = SERVICE_OPTIONS.find((s) => s.slug === slug);
                                                    return (
                                                        <Chip
                                                            key={slug}
                                                            label={srv ? srv.short : slug}
                                                            size="small"
                                                            color="secondary"
                                                            variant="outlined"
                                                            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <Chip label="Bikes Only (Default)" size="small" variant="outlined" sx={{ fontStyle: 'italic', fontSize: '0.72rem' }} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.status}
                                            size="small"
                                            color={user.status === 'active' ? 'success' : 'default'}
                                            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(user)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setDeletingStaff(user);
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
            )}

            {/* Create Staff Dialog */}
            <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Create Staff Member</DialogTitle>
                <Box component="form" onSubmit={handleCreateSubmit} noValidate>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {Object.keys(createForm.errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please correct the errors below before submitting.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Full Name"
                                    placeholder="e.g. Ramesh Kumar"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    error={Boolean(createForm.errors.name)}
                                    helperText={createForm.errors.name}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    type="email"
                                    label="Email Address"
                                    placeholder="ramesh@gkwhizwheel.com"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    error={Boolean(createForm.errors.email)}
                                    helperText={createForm.errors.email}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Phone Number"
                                    placeholder="9876500055"
                                    value={createForm.data.phone}
                                    onChange={(e) => createForm.setData('phone', e.target.value)}
                                    error={Boolean(createForm.errors.phone)}
                                    helperText={createForm.errors.phone}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    type="password"
                                    label="Password"
                                    placeholder="Min 8 characters"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    error={Boolean(createForm.errors.password)}
                                    helperText={createForm.errors.password}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Role Assignment"
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    error={Boolean(createForm.errors.role)}
                                    helperText={createForm.errors.role}
                                >
                                    {roles.map((r) => (
                                        <MenuItem key={r.value} value={r.value}>
                                            {r.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Multi-Store Assignment Selector */}
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth error={Boolean(createForm.errors.store_ids)}>
                                    <InputLabel id="assign-stores-label">Assign to Store Hubs (Multiple)</InputLabel>
                                    <Select
                                        labelId="assign-stores-label"
                                        multiple
                                        value={createForm.data.store_ids}
                                        onChange={(e) => createForm.setData('store_ids', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                        input={<OutlinedInput label="Assign to Store Hubs (Multiple)" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((val) => {
                                                    const st = stores.find((s) => s.id === val);
                                                    return <Chip key={val} label={st ? st.name : val} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Checkbox checked={createForm.data.store_ids.indexOf(s.id) > -1} />
                                                <ListItemText primary={s.name} secondary={s.city} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Managed Services & Permissions Selector */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <CategoryIcon fontSize="small" color="primary" /> Managed Services (Role-Based Access)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Select which services this account can oversee, view bookings for, and edit inventory.
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => createForm.setData('services', SERVICE_OPTIONS.map((s) => s.slug))}
                                                sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => createForm.setData('services', [])}
                                                sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                                            >
                                                Clear
                                            </Button>
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ gap: 0.8 }}>
                                        {SERVICE_OPTIONS.map((srv) => {
                                            const isSelected = (createForm.data.services || []).includes(srv.slug);
                                            return (
                                                <Chip
                                                    key={srv.slug}
                                                    label={srv.name}
                                                    onClick={() => {
                                                        const current = createForm.data.services || [];
                                                        const updated = isSelected
                                                            ? current.filter((s) => s !== srv.slug)
                                                            : [...current, srv.slug];
                                                        createForm.setData('services', updated);
                                                    }}
                                                    color={isSelected ? 'primary' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    sx={{
                                                        fontWeight: isSelected ? 700 : 500,
                                                        cursor: 'pointer',
                                                        borderRadius: 1.5,
                                                    }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {createForm.errors.services && (
                                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                            {createForm.errors.services}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCreateModalOpen(false)} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createForm.processing}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                        >
                            {createForm.processing ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Edit Staff Dialog */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Edit Staff: {editingStaff?.name}</DialogTitle>
                <Box component="form" onSubmit={handleEditSubmit} noValidate>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {Object.keys(editForm.errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please review the errors below before submitting.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Full Name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    error={Boolean(editForm.errors.name)}
                                    helperText={editForm.errors.name}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    type="email"
                                    label="Email Address"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    error={Boolean(editForm.errors.email)}
                                    helperText={editForm.errors.email}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Phone Number"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                    error={Boolean(editForm.errors.phone)}
                                    helperText={editForm.errors.phone}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Role Assignment"
                                    value={editForm.data.role}
                                    onChange={(e) => editForm.setData('role', e.target.value)}
                                    error={Boolean(editForm.errors.role)}
                                    helperText={editForm.errors.role}
                                >
                                    {roles.map((r) => (
                                        <MenuItem key={r.value} value={r.value}>
                                            {r.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Account Status"
                                    value={editForm.data.status}
                                    onChange={(e) => editForm.setData('status', e.target.value)}
                                    error={Boolean(editForm.errors.status)}
                                    helperText={editForm.errors.status}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="suspended">Suspended</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label="Reset Password (Optional)"
                                    placeholder="Leave blank to keep existing password"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    error={Boolean(editForm.errors.password)}
                                    helperText={editForm.errors.password}
                                />
                            </Grid>

                            {/* Multi-Store Assignment Selector */}
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth error={Boolean(editForm.errors.store_ids)}>
                                    <InputLabel id="edit-assign-stores-label">Assign to Store Hubs (Multiple)</InputLabel>
                                    <Select
                                        labelId="edit-assign-stores-label"
                                        multiple
                                        value={editForm.data.store_ids}
                                        onChange={(e) => editForm.setData('store_ids', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                        input={<OutlinedInput label="Assign to Store Hubs (Multiple)" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((val) => {
                                                    const st = stores.find((s) => s.id === val);
                                                    return <Chip key={val} label={st ? st.name : val} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Checkbox checked={editForm.data.store_ids.indexOf(s.id) > -1} />
                                                <ListItemText primary={s.name} secondary={s.city} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Managed Services & Permissions Selector */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <CategoryIcon fontSize="small" color="primary" /> Managed Services (Role-Based Access)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Select which services this account can oversee, view bookings for, and edit inventory.
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => editForm.setData('services', SERVICE_OPTIONS.map((s) => s.slug))}
                                                sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => editForm.setData('services', [])}
                                                sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                                            >
                                                Clear
                                            </Button>
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ gap: 0.8 }}>
                                        {SERVICE_OPTIONS.map((srv) => {
                                            const isSelected = (editForm.data.services || []).includes(srv.slug);
                                            return (
                                                <Chip
                                                    key={srv.slug}
                                                    label={srv.name}
                                                    onClick={() => {
                                                        const current = editForm.data.services || [];
                                                        const updated = isSelected
                                                            ? current.filter((s) => s !== srv.slug)
                                                            : [...current, srv.slug];
                                                        editForm.setData('services', updated);
                                                    }}
                                                    color={isSelected ? 'primary' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    sx={{
                                                        fontWeight: isSelected ? 700 : 500,
                                                        cursor: 'pointer',
                                                        borderRadius: 1.5,
                                                    }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {editForm.errors.services && (
                                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                            {editForm.errors.services}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={editForm.processing}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                        >
                            {editForm.processing ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Delete Staff Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deactivation</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to deactivate and remove staff member <strong>{deletingStaff?.name}</strong>? This user will no longer be able to log in to the admin/staff portal.
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
                        Deactivate Account
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

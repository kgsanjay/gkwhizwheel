import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useColorMode } from '../../../theme/ColorModeContext';
import {
    Box,
    Typography,
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
    Tooltip,
    Grid,
    Badge as MuiBadge,
    Snackbar,
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
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/ScubaDiving';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CloseIcon from '@mui/icons-material/Close';

const SERVICE_OPTIONS = [
    { slug: 'two_wheelers', name: 'Two-Wheelers & Bikes', short: 'Bikes', color: '#10B981', icon: <TwoWheelerIcon sx={{ fontSize: 15 }} /> },
    { slug: 'taxi', name: 'Cabs & Taxi Fleet', short: 'Taxi', color: '#0284C7', icon: <LocalTaxiIcon sx={{ fontSize: 15 }} /> },
    { slug: 'boating', name: 'Boating & Water Sports', short: 'Boating', color: '#06B6D4', icon: <DirectionsBoatIcon sx={{ fontSize: 15 }} /> },
    { slug: 'scuba', name: 'Scuba Diving & Snorkeling', short: 'Scuba', color: '#8B5CF6', icon: <ScubaDivingIcon sx={{ fontSize: 15 }} /> },
    { slug: 'homestay', name: 'Coastal Homestays', short: 'Stays', color: '#EC4899', icon: <HomeWorkIcon sx={{ fontSize: 15 }} /> },
    { slug: 'guide', name: 'Local Tour Guides', short: 'Guides', color: '#F97316', icon: <ExploreIcon sx={{ fontSize: 15 }} /> },
    { slug: 'tours', name: 'Custom Packages & Tours', short: 'Tours', color: '#F59E0B', icon: <LuggageIcon sx={{ fontSize: 15 }} /> },
];

export default function StaffIndex({
    staff = [],
    stores = [],
    stats = {},
    filters = {},
    roles = [],
    available_services = [],
}) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [storeFilter, setStoreFilter] = useState(filters.store_id || '');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal dialogs state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingStaff, setDeletingStaff] = useState(null);

    // Password visibility toggles
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Snackbar notifications
    const [toastMessage, setToastMessage] = useState('');
    const [toastOpen, setToastOpen] = useState(false);

    const showToast = (msg) => {
        setToastMessage(msg);
        setToastOpen(true);
    };

    // Forms setup
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        store_ids: [],
        services: ['two_wheelers'],
    });

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

    // Real-time client side filtering
    const filteredStaff = useMemo(() => {
        return staff.filter((u) => {
            if (roleFilter && u.role !== roleFilter) return false;
            if (statusFilter && u.status !== statusFilter) return false;
            if (storeFilter && storeFilter !== 'all') {
                const storeIdNum = Number(storeFilter);
                const hasStore = u.stores?.some((s) => s.id === storeIdNum);
                if (!hasStore && !u.can_access_all_stores) return false;
            }
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = u.name?.toLowerCase().includes(q);
            const emailMatch = u.email?.toLowerCase().includes(q);
            const phoneMatch = u.phone?.toLowerCase().includes(q);
            const storeMatch = u.stores?.some((s) => s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q));
            const serviceMatch = u.services?.some((s) => s?.toLowerCase().includes(q));
            return nameMatch || emailMatch || phoneMatch || storeMatch || serviceMatch;
        });
    }, [staff, searchQuery, roleFilter, storeFilter, statusFilter]);

    // Clear all filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
        setStoreFilter('');
        setStatusFilter('');
    };

    const hasActiveFilters = Boolean(searchQuery || roleFilter || storeFilter || statusFilter);

    // Create handlers
    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        createForm.setData({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'staff',
            store_ids: stores.length === 1 ? [stores[0].id] : [],
            services: ['two_wheelers'],
        });
        setShowCreatePassword(false);
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/admin/staff', {
            onSuccess: () => {
                setCreateModalOpen(false);
                showToast('Staff member created successfully');
            },
        });
    };

    // Edit handlers
    const handleOpenEdit = (user) => {
        editForm.clearErrors();
        setEditingStaff(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status === 'blacklisted' ? 'suspended' : user.status,
            password: '',
            store_ids: user.stores ? user.stores.map((s) => s.id) : [],
            services: user.services && user.services.length > 0 ? user.services : ['two_wheelers'],
        });
        setShowEditPassword(false);
        setEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingStaff) return;
        editForm.put(`/admin/staff/${editingStaff.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingStaff(null);
                showToast('Staff profile updated successfully');
            },
        });
    };

    // Quick status toggle
    const handleToggleStatus = (user) => {
        router.post(`/admin/staff/${user.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                const next = user.status === 'active' ? 'suspended' : 'activated';
                showToast(`Staff member ${user.name} is now ${next}.`);
            },
        });
    };

    // Delete handlers
    const handleConfirmDelete = () => {
        if (!deletingStaff) return;
        router.delete(`/admin/staff/${deletingStaff.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingStaff(null);
                showToast('Staff account deactivated.');
            },
        });
    };

    // Copy to clipboard helper
    const handleCopyText = (text, label) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard!`);
    };

    // Format WhatsApp link
    const getWhatsAppUrl = (phone, name) => {
        if (!phone) return null;
        const cleanDigits = phone.replace(/\D/g, '');
        const standard = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
        const msg = encodeURIComponent(`Hello ${name}, connecting from GK WhizWheel Admin HQ.`);
        return `https://wa.me/${standard}?text=${msg}`;
    };

    return (
        <AdminLayout title="Staff Management">
            <Head title="Staff Management - Admin" />

            <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1.5, sm: 2.5 } }}>
                {/* Header Action Bar */}
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
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', sm: '1.9rem' }, letterSpacing: '-0.02em', color: 'text.primary' }}>
                                Staff & Store Managers
                            </Typography>
                            <Chip
                                label={`${staff.length} Deployed`}
                                size="small"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)',
                                    color: isDark ? '#FBBF24' : '#B45309',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            />
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontSize: '0.85rem' }}>
                            Provision ground operational personnel, assign multi-store hubs, configure service access, and manage credentials.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                        sx={{
                            borderRadius: 2.2,
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 2.8,
                            py: 1,
                            fontSize: '0.85rem',
                            bgcolor: isDark ? '#F59E0B' : '#0F172A',
                            color: isDark ? '#0F172A' : '#FFFFFF',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            '&:hover': {
                                bgcolor: isDark ? '#D97706' : '#1E293B',
                            },
                        }}
                    >
                        Add Staff Member
                    </Button>
                </Box>

                {/* Operations KPI Metrics Strip */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226, 232, 240, 0.9)',
                                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                                    Total Team
                                </Typography>
                                <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.8 }} />
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.6, fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
                                {stats.total ?? staff.length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                Ground & Store Personnel
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.05)' : '#FFFBEB',
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: isDark ? '#FBBF24' : '#B45309', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                                    Store Managers
                                </Typography>
                                <SupervisorAccountIcon sx={{ fontSize: 18, color: isDark ? '#FBBF24' : '#B45309' }} />
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.6, color: isDark ? '#FBBF24' : '#B45309', fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
                                {stats.managers ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                Branch & Hub Supervisors
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.25)',
                                bgcolor: isDark ? 'rgba(2, 132, 199, 0.05)' : '#F0F9FF',
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: isDark ? '#38BDF8' : '#0369A1', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                                    Operations Staff
                                </Typography>
                                <PersonIcon sx={{ fontSize: 18, color: isDark ? '#38BDF8' : '#0369A1' }} />
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.6, color: isDark ? '#38BDF8' : '#0369A1', fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
                                {stats.staff ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                Dispatch & Check-in Desk
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#ECFDF5',
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: isDark ? '#34D399' : '#059669', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                                    Active & Deployed
                                </Typography>
                                <CheckCircleIcon sx={{ fontSize: 18, color: isDark ? '#34D399' : '#059669' }} />
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.6, color: isDark ? '#34D399' : '#059669', fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
                                {stats.active ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                {stats.total > 0 ? `${Math.round(((stats.active || 0) / stats.total) * 100)}% Operational Ready` : 'Ready for deployment'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Filter and Search Bar */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 2.5,
                        mb: 3,
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226, 232, 240, 0.9)',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                    }}
                >
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, md: 4.5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name, email, phone, branch, service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                <CloseIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Role Filter"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                                    },
                                }}
                            >
                                <MenuItem value="">All Roles</MenuItem>
                                <MenuItem value="store_manager">Store Managers</MenuItem>
                                <MenuItem value="staff">Operations Staff</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Assigned Store Hub"
                                value={storeFilter}
                                onChange={(e) => setStoreFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                                    },
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

                        <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                                    },
                                }}
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="blacklisted">Suspended</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {hasActiveFilters && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        height: 40,
                                        width: '100%',
                                        color: 'text.secondary',
                                    }}
                                >
                                    Reset
                                </Button>
                            )}
                        </Grid>
                    </Grid>

                    {/* Filter count indicator */}
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Showing <strong>{filteredStaff.length}</strong> of <strong>{staff.length}</strong> staff accounts
                        </Typography>
                        {hasActiveFilters && (
                            <Chip
                                size="small"
                                label="Filtered view active"
                                color="warning"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                            />
                        )}
                    </Box>
                </Paper>

                {/* Staff Content: Empty State vs Tables vs Mobile Cards */}
                {filteredStaff.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 3,
                            border: '1px dashed',
                            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                        }}
                    >
                        <BadgeIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {hasActiveFilters ? 'No staff matching filter criteria' : 'No staff personnel created yet'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 3, maxWidth: 450, mx: 'auto' }}>
                            {hasActiveFilters
                                ? 'Try clearing your search terms, role selection, or branch filter to view more members.'
                                : 'Provision your first store manager or operations personnel to enable ground check-ins, offline bookings, and dispatch.'}
                        </Typography>
                        {hasActiveFilters ? (
                            <Button variant="outlined" onClick={handleClearFilters} sx={{ textTransform: 'none', borderRadius: 2 }}>
                                Clear All Filters
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<AddIcon />}
                                onClick={handleOpenCreate}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2.2,
                                    fontWeight: 800,
                                    bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                    color: isDark ? '#0F172A' : '#FFFFFF',
                                }}
                            >
                                Add First Staff Member
                            </Button>
                        )}
                    </Paper>
                ) : (
                    <>
                        {/* 1. Desktop & Tablet Table (Hidden on small mobile) */}
                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                display: { xs: 'none', lg: 'block' },
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226, 232, 240, 0.9)',
                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                                overflowX: 'auto',
                            }}
                        >
                            <Table sx={{ minWidth: 1050 }}>
                                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Staff Member</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Role & Access</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Direct Contact</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Assigned Hubs</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Managed Services</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.76rem', textTransform: 'uppercase', color: 'text.secondary', py: 1.8 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredStaff.map((user) => {
                                        const isManager = user.role === 'store_manager' || user.role === 'admin';
                                        const isActive = user.status === 'active';
                                        const waUrl = getWhatsAppUrl(user.phone, user.name);

                                        return (
                                            <TableRow
                                                key={user.id}
                                                hover
                                                sx={{
                                                    transition: 'background-color 0.15s ease',
                                                    '&:hover': {
                                                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                                    },
                                                }}
                                            >
                                                {/* Staff Name & Avatar */}
                                                <TableCell sx={{ py: 2 }}>
                                                    <Stack direction="row" spacing={1.6} alignItems="center">
                                                        <MuiBadge
                                                            overlap="circular"
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            variant="dot"
                                                            sx={{
                                                                '& .MuiBadge-badge': {
                                                                    bgcolor: isActive ? 'success.main' : 'error.main',
                                                                    boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
                                                                },
                                                            }}
                                                        >
                                                            <Avatar
                                                                sx={{
                                                                    width: 40,
                                                                    height: 40,
                                                                    bgcolor: isManager ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7') : (isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE'),
                                                                    color: isManager ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#38BDF8' : '#0369A1'),
                                                                    fontWeight: 900,
                                                                    fontSize: '0.9rem',
                                                                    border: `1.5px solid ${isManager ? 'rgba(245, 158, 11, 0.4)' : 'rgba(2, 132, 199, 0.4)'}`,
                                                                }}
                                                            >
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        </MuiBadge>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary', lineHeight: 1.2 }}>
                                                                {user.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem', mt: 0.2 }}>
                                                                Staff ID #{user.id}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell sx={{ py: 2 }}>
                                                    {isManager ? (
                                                        <Chip
                                                            icon={<SupervisorAccountIcon sx={{ fontSize: '15px !important', color: '#B45309 !important' }} />}
                                                            label="Store Manager"
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.74rem',
                                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFFBEB',
                                                                color: isDark ? '#FBBF24' : '#B45309',
                                                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                                            }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<PersonIcon sx={{ fontSize: '15px !important', color: '#0369A1 !important' }} />}
                                                            label="Operations Staff"
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.74rem',
                                                                bgcolor: isDark ? 'rgba(2, 132, 199, 0.14)' : '#F0F9FF',
                                                                color: isDark ? '#7DD3FC' : '#0369A1',
                                                                border: '1px solid rgba(2, 132, 199, 0.3)',
                                                            }}
                                                        />
                                                    )}
                                                </TableCell>

                                                {/* Direct Contact Links */}
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box>
                                                        <Stack direction="row" alignItems="center" spacing={0.8}>
                                                            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography
                                                                component="a"
                                                                href={`tel:${user.phone}`}
                                                                sx={{
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 700,
                                                                    color: 'text.primary',
                                                                    textDecoration: 'none',
                                                                    '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                                                                }}
                                                            >
                                                                {user.phone}
                                                            </Typography>
                                                            {waUrl && (
                                                                <Tooltip title="Message via WhatsApp">
                                                                    <IconButton
                                                                        component="a"
                                                                        href={waUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        size="small"
                                                                        sx={{
                                                                            p: 0.3,
                                                                            color: '#25D366',
                                                                            bgcolor: isDark ? 'rgba(37, 211, 102, 0.1)' : 'rgba(37, 211, 102, 0.08)',
                                                                            '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.2)' },
                                                                        }}
                                                                    >
                                                                        <WhatsAppIcon sx={{ fontSize: 15 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="Copy Phone">
                                                                <IconButton size="small" onClick={() => handleCopyText(user.phone, 'Phone number')} sx={{ p: 0.3, color: 'text.secondary' }}>
                                                                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>

                                                        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.4 }}>
                                                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography
                                                                component="a"
                                                                href={`mailto:${user.email}`}
                                                                sx={{
                                                                    fontSize: '0.74rem',
                                                                    color: 'text.secondary',
                                                                    textDecoration: 'none',
                                                                    '&:hover': { textDecoration: 'underline', color: 'text.primary' },
                                                                }}
                                                            >
                                                                {user.email}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                </TableCell>

                                                {/* Assigned Store Hubs */}
                                                <TableCell sx={{ py: 2 }}>
                                                    {user.can_access_all_stores ? (
                                                        <Chip
                                                            icon={<StoreIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                                                            label="All Branches (HQ Global)"
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.72rem',
                                                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                                                                color: isDark ? '#34D399' : '#059669',
                                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                            }}
                                                        />
                                                    ) : user.stores && user.stores.length > 0 ? (
                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5, maxWidth: 240 }}>
                                                            {user.stores.map((s) => (
                                                                <Chip
                                                                    key={s.id}
                                                                    icon={<StoreIcon sx={{ fontSize: '13px !important' }} />}
                                                                    label={`${s.name} (${s.city})`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        fontSize: '0.72rem',
                                                                        height: 22,
                                                                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                                    }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    ) : (
                                                        <Chip label="Unassigned" size="small" sx={{ fontStyle: 'italic', fontSize: '0.72rem', height: 22 }} />
                                                    )}
                                                </TableCell>

                                                {/* Assigned Services */}
                                                <TableCell sx={{ py: 2 }}>
                                                    {user.services && user.services.length === SERVICE_OPTIONS.length ? (
                                                        <Chip
                                                            icon={<CategoryIcon sx={{ fontSize: '14px !important', color: '#F59E0B !important' }} />}
                                                            label="All 7 Services (Full Ops)"
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.72rem',
                                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                                                                color: isDark ? '#FBBF24' : '#B45309',
                                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                            }}
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
                                                                        variant="outlined"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            fontSize: '0.7rem',
                                                                            height: 20,
                                                                            borderColor: srv ? `${srv.color}66` : 'divider',
                                                                            color: srv ? srv.color : 'text.primary',
                                                                            bgcolor: srv ? `${srv.color}11` : 'transparent',
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </Stack>
                                                    ) : (
                                                        <Chip label="Two-Wheelers (Default)" size="small" variant="outlined" sx={{ fontStyle: 'italic', fontSize: '0.7rem', height: 20 }} />
                                                    )}
                                                </TableCell>

                                                {/* Status & Quick Toggle */}
                                                <TableCell sx={{ py: 2 }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Chip
                                                            label={isActive ? 'Active' : 'Suspended'}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.72rem',
                                                                bgcolor: isActive
                                                                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7')
                                                                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2'),
                                                                color: isActive
                                                                    ? (isDark ? '#34D399' : '#15803D')
                                                                    : (isDark ? '#F87171' : '#B91C1C'),
                                                                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                                                            }}
                                                        />
                                                        <Tooltip title={isActive ? 'Suspend Staff Access' : 'Activate Staff Access'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleToggleStatus(user)}
                                                                sx={{
                                                                    color: isActive ? 'warning.main' : 'success.main',
                                                                    p: 0.4,
                                                                }}
                                                            >
                                                                {isActive ? <PauseCircleIcon sx={{ fontSize: 18 }} /> : <PlayCircleIcon sx={{ fontSize: 18 }} />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell align="right" sx={{ py: 2 }}>
                                                    <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                                                        <Tooltip title="Edit Staff Profile & Access">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenEdit(user)}
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    bgcolor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                                                                    '&:hover': { bgcolor: isDark ? 'rgba(2, 132, 199, 0.22)' : 'rgba(2, 132, 199, 0.16)' },
                                                                }}
                                                            >
                                                                <EditIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Deactivate & Remove Staff">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setDeletingStaff(user);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                sx={{
                                                                    color: 'error.main',
                                                                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                                                    '&:hover': { bgcolor: isDark ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.16)' },
                                                                }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* 2. Mobile Responsive Card List (Visible on phones & small tablets) */}
                        <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 2 }}>
                            {filteredStaff.map((user) => {
                                const isManager = user.role === 'store_manager' || user.role === 'admin';
                                const isActive = user.status === 'active';
                                const waUrl = getWhatsAppUrl(user.phone, user.name);

                                return (
                                    <Card
                                        key={user.id}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '1px solid',
                                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226, 232, 240, 0.9)',
                                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                                        }}
                                    >
                                        {/* Card Top: Avatar, Name, Role & Status */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar
                                                    sx={{
                                                        width: 44,
                                                        height: 44,
                                                        bgcolor: isManager ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7') : (isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE'),
                                                        color: isManager ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#38BDF8' : '#0369A1'),
                                                        fontWeight: 900,
                                                        fontSize: '1rem',
                                                        border: `1.5px solid ${isManager ? 'rgba(245, 158, 11, 0.4)' : 'rgba(2, 132, 199, 0.4)'}`,
                                                    }}
                                                >
                                                    {user.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                                        {user.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                                        ID #{user.id} • {isManager ? 'Store Manager' : 'Operations Staff'}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Chip
                                                label={isActive ? 'Active' : 'Suspended'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: '0.7rem',
                                                    height: 22,
                                                    bgcolor: isActive ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2'),
                                                    color: isActive ? (isDark ? '#34D399' : '#15803D') : (isDark ? '#F87171' : '#B91C1C'),
                                                }}
                                            />
                                        </Box>

                                        {/* Contact & WhatsApp Bar */}
                                        <Box sx={{ p: 1.2, mb: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Box>
                                                    <Typography
                                                        component="a"
                                                        href={`tel:${user.phone}`}
                                                        sx={{ fontWeight: 700, fontSize: '0.84rem', color: 'text.primary', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.6 }}
                                                    >
                                                        <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {user.phone}
                                                    </Typography>
                                                    <Typography
                                                        component="a"
                                                        href={`mailto:${user.email}`}
                                                        sx={{ fontSize: '0.72rem', color: 'text.secondary', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.3 }}
                                                    >
                                                        <EmailIcon sx={{ fontSize: 13, color: 'text.secondary' }} /> {user.email}
                                                    </Typography>
                                                </Box>
                                                {waUrl && (
                                                    <Button
                                                        component="a"
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                                                        sx={{
                                                            bgcolor: '#25D366',
                                                            color: '#FFFFFF',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem',
                                                            textTransform: 'none',
                                                            borderRadius: 1.8,
                                                            py: 0.4,
                                                            px: 1.2,
                                                            '&:hover': { bgcolor: '#1EBE5D' },
                                                        }}
                                                    >
                                                        Chat
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Box>

                                        {/* Store Hubs */}
                                        <Box sx={{ mb: 1.2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                                                Assigned Hubs:
                                            </Typography>
                                            {user.can_access_all_stores ? (
                                                <Chip label="All Branches (Global Access)" size="small" color="success" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }} />
                                            ) : user.stores && user.stores.length > 0 ? (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                                                    {user.stores.map((s) => (
                                                        <Chip key={s.id} icon={<StoreIcon sx={{ fontSize: '13px !important' }} />} label={`${s.name} (${s.city})`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.72rem' }} />
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Unassigned to store hub</Typography>
                                            )}
                                        </Box>

                                        {/* Managed Services */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                                                Service Permissions:
                                            </Typography>
                                            {user.services && user.services.length === SERVICE_OPTIONS.length ? (
                                                <Chip label="All 7 Services (Full Ops)" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                                            ) : user.services && user.services.length > 0 ? (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                                                    {user.services.map((slug) => {
                                                        const srv = SERVICE_OPTIONS.find((s) => s.slug === slug);
                                                        return (
                                                            <Chip
                                                                key={slug}
                                                                label={srv ? srv.short : slug}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, borderColor: srv ? `${srv.color}66` : 'divider', color: srv ? srv.color : 'text.primary' }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Two-Wheelers only</Typography>
                                            )}
                                        </Box>

                                        <Divider sx={{ mb: 1.5 }} />

                                        {/* Footer Actions */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={isActive ? 'warning' : 'success'}
                                                startIcon={isActive ? <PauseCircleIcon /> : <PlayCircleIcon />}
                                                onClick={() => handleToggleStatus(user)}
                                                sx={{ textTransform: 'none', fontSize: '0.74rem', fontWeight: 700, borderRadius: 1.8 }}
                                            >
                                                {isActive ? 'Suspend' : 'Activate'}
                                            </Button>

                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleOpenEdit(user)}
                                                    sx={{ textTransform: 'none', fontSize: '0.74rem', fontWeight: 700, borderRadius: 1.8 }}
                                                >
                                                    Edit
                                                </Button>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => {
                                                        setDeletingStaff(user);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    sx={{ bgcolor: 'action.hover' }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>
                    </>
                )}
            </Box>

            {/* Create Staff Dialog */}
            <Dialog
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon sx={{ color: 'warning.main' }} />
                        <span>Provision New Staff Member</span>
                    </Stack>
                    <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleCreateSubmit} noValidate autoComplete="off">
                    {/* Dummy hidden inputs to stop aggressive browser autofill of admin credentials */}
                    <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                    <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {Object.keys(createForm.errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please review and correct the errors below before saving.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {/* Personal & Contact Details */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                                    1. Identity & Contact Information
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Name and mobile number used for login, customer check-in identity, and OTP SMS verification.
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Full Name"
                                    placeholder="e.g. Ramesh Kumar"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    error={Boolean(createForm.errors.name)}
                                    helperText={createForm.errors.name}
                                    inputProps={{ autoComplete: 'off' }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="10-Digit Mobile Number"
                                    placeholder="9876500055"
                                    value={createForm.data.phone}
                                    onChange={(e) => createForm.setData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    error={Boolean(createForm.errors.phone)}
                                    helperText={createForm.errors.phone || 'Used for login & WhatsApp notifications'}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                                    }}
                                    inputProps={{ autoComplete: 'off' }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    type="email"
                                    label="Email Address"
                                    placeholder="ramesh@gkwhizwheel.com"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    error={Boolean(createForm.errors.email)}
                                    helperText={createForm.errors.email}
                                    inputProps={{ autoComplete: 'new-email' }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Operational Role"
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    error={Boolean(createForm.errors.role)}
                                    helperText={createForm.errors.role || 'Store Managers can manage staff & see revenue'}
                                >
                                    {roles.map((r) => (
                                        <MenuItem key={r.value} value={r.value}>
                                            {r.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Credentials & Role */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                                    2. Security & Login Credentials
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Set an initial password for this staff member (minimum 8 characters).
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    type={showCreatePassword ? 'text' : 'password'}
                                    label="Login Password"
                                    placeholder="Minimum 8 characters"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    error={Boolean(createForm.errors.password)}
                                    helperText={createForm.errors.password || 'Staff can use this password to sign into the portal'}
                                    inputProps={{ autoComplete: 'new-password' }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowCreatePassword((p) => !p)} edge="end">
                                                    {showCreatePassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Multi-Store Assignment Selector */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <StoreIcon fontSize="small" sx={{ color: 'primary.main' }} /> Store Hub Assignments (Physical Branches)
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => createForm.setData('store_ids', stores.map((s) => s.id))}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
                                            >
                                                Assign All Branches
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => createForm.setData('store_ids', [])}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
                                            >
                                                Clear
                                            </Button>
                                        </Stack>
                                    </Box>

                                    <FormControl fullWidth size="small" error={Boolean(createForm.errors.store_ids)}>
                                        <InputLabel id="assign-stores-label">Choose Store Locations</InputLabel>
                                        <Select
                                            labelId="assign-stores-label"
                                            multiple
                                            value={createForm.data.store_ids}
                                            onChange={(e) => createForm.setData('store_ids', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                            input={<OutlinedInput label="Choose Store Locations" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((val) => {
                                                        const st = stores.find((s) => s.id === val);
                                                        return <Chip key={val} label={st ? `${st.name} (${st.city})` : val} size="small" />;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {stores.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    <Checkbox checked={createForm.data.store_ids.indexOf(s.id) > -1} />
                                                    <ListItemText primary={s.name} secondary={`${s.city}, ${s.state}`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>

                            {/* Managed Services Selector */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <CategoryIcon fontSize="small" sx={{ color: 'warning.main' }} /> Managed Services (Multi-Vertical Scoping)
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Check which service categories this staff member can manage and take offline bookings for:
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => createForm.setData('services', SERVICE_OPTIONS.map((s) => s.slug))}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
                                            >
                                                Select All (7 Services)
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => createForm.setData('services', [])}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
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
                                                    icon={srv.icon}
                                                    label={srv.name}
                                                    onClick={() => {
                                                        const current = createForm.data.services || [];
                                                        const updated = isSelected
                                                            ? current.filter((s) => s !== srv.slug)
                                                            : [...current, srv.slug];
                                                        createForm.setData('services', updated);
                                                    }}
                                                    color={isSelected ? 'warning' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    sx={{
                                                        fontWeight: isSelected ? 800 : 600,
                                                        fontSize: '0.76rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 2,
                                                        py: 1.8,
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
                        <Button onClick={() => setCreateModalOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
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
                            {createForm.processing ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Edit Staff Dialog */}
            <Dialog
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <EditIcon sx={{ color: 'primary.main' }} />
                        <span>Edit Staff: {editingStaff?.name} (ID #{editingStaff?.id})</span>
                    </Stack>
                    <IconButton size="small" onClick={() => setEditModalOpen(false)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleEditSubmit} noValidate autoComplete="off">
                    {/* Dummy hidden inputs to stop aggressive browser autofill */}
                    <input type="text" name="prevent_autofill_user_edit" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                    <input type="password" name="prevent_autofill_pass_edit" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {Object.keys(editForm.errors).length > 0 && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                Please review and correct the errors below before saving.
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                                    1. Identity & Contact Information
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Full Name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    error={Boolean(editForm.errors.name)}
                                    helperText={editForm.errors.name}
                                    inputProps={{ autoComplete: 'off' }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Phone Number"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    error={Boolean(editForm.errors.phone)}
                                    helperText={editForm.errors.phone}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                                    }}
                                    inputProps={{ autoComplete: 'off' }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    type="email"
                                    label="Email Address"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    error={Boolean(editForm.errors.email)}
                                    helperText={editForm.errors.email}
                                    inputProps={{ autoComplete: 'new-email' }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Operational Role"
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

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                                    2. Account Status & Password Reset
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Account Status"
                                    value={editForm.data.status}
                                    onChange={(e) => editForm.setData('status', e.target.value)}
                                    error={Boolean(editForm.errors.status)}
                                    helperText={editForm.errors.status}
                                >
                                    <MenuItem value="active">Active (Operational)</MenuItem>
                                    <MenuItem value="suspended">Suspended (Access Blocked)</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type={showEditPassword ? 'text' : 'password'}
                                    label="Reset Password (Optional)"
                                    placeholder="Leave blank to keep current"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    error={Boolean(editForm.errors.password)}
                                    helperText={editForm.errors.password || 'Min 8 characters if changing'}
                                    inputProps={{ autoComplete: 'new-password' }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowEditPassword((p) => !p)} edge="end">
                                                    {showEditPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Multi-Store Assignment Selector */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <StoreIcon fontSize="small" sx={{ color: 'primary.main' }} /> Assigned Store Hubs
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => editForm.setData('store_ids', stores.map((s) => s.id))}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
                                            >
                                                Assign All Branches
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => editForm.setData('store_ids', [])}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
                                            >
                                                Clear
                                            </Button>
                                        </Stack>
                                    </Box>

                                    <FormControl fullWidth size="small" error={Boolean(editForm.errors.store_ids)}>
                                        <InputLabel id="edit-assign-stores-label">Store Locations</InputLabel>
                                        <Select
                                            labelId="edit-assign-stores-label"
                                            multiple
                                            value={editForm.data.store_ids}
                                            onChange={(e) => editForm.setData('store_ids', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                            input={<OutlinedInput label="Store Locations" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((val) => {
                                                        const st = stores.find((s) => s.id === val);
                                                        return <Chip key={val} label={st ? `${st.name} (${st.city})` : val} size="small" />;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {stores.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    <Checkbox checked={editForm.data.store_ids.indexOf(s.id) > -1} />
                                                    <ListItemText primary={s.name} secondary={`${s.city}, ${s.state}`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>

                            {/* Managed Services Selector */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <CategoryIcon fontSize="small" sx={{ color: 'warning.main' }} /> Managed Services (Multi-Vertical Scoping)
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Select active service categories this staff member can view and manage:
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => editForm.setData('services', SERVICE_OPTIONS.map((s) => s.slug))}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
                                            >
                                                Select All (7 Services)
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => editForm.setData('services', [])}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0 }}
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
                                                    icon={srv.icon}
                                                    label={srv.name}
                                                    onClick={() => {
                                                        const current = editForm.data.services || [];
                                                        const updated = isSelected
                                                            ? current.filter((s) => s !== srv.slug)
                                                            : [...current, srv.slug];
                                                        editForm.setData('services', updated);
                                                    }}
                                                    color={isSelected ? 'warning' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    sx={{
                                                        fontWeight: isSelected ? 800 : 600,
                                                        fontSize: '0.76rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 2,
                                                        py: 1.8,
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
                        <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
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

            {/* Delete Staff Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.15rem' }}>Deactivate Staff Account</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Are you sure you want to deactivate and remove staff member <strong>{deletingStaff?.name}</strong>?
                    </Typography>
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block' }}>
                            • Immediate access revocation: This user will no longer be able to log in to the admin or staff check-in portal.
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block', mt: 0.5 }}>
                            • Past audit trail and handover signatures will remain archived for compliance.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 800 }}
                    >
                        Deactivate Account
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quick Toast Notification */}
            <Snackbar
                open={toastOpen}
                autoHideDuration={3000}
                onClose={() => setToastOpen(false)}
                message={toastMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </AdminLayout>
    );
}

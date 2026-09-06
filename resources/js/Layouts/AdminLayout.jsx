import React, { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Toolbar,
    Typography,
    Chip,
    Avatar,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SwapHorizontalCircleIcon from '@mui/icons-material/SwapHorizontalCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import SyncIcon from '@mui/icons-material/Sync';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BadgeIcon from '@mui/icons-material/Badge';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import StoreIcon from '@mui/icons-material/Store';
import PersonIcon from '@mui/icons-material/Person';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const DRAWER_WIDTH = 260;

const MENU_SECTIONS = [
    {
        title: 'Overview',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon />, roles: ['super_admin', 'store_manager', 'staff'] },
        ],
    },
    {
        title: 'Store Operations',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            { label: 'Handovers & Returns', path: '/admin/operations', icon: <SwapHorizontalCircleIcon />, roles: ['super_admin', 'store_manager', 'staff'] },
            { label: 'Active Bookings', path: '/admin/bookings', icon: <ReceiptLongIcon />, roles: ['super_admin', 'store_manager', 'staff'] },
            { label: 'Customer KYC & Lookup', path: '/admin/customers', icon: <ContactEmergencyIcon />, roles: ['super_admin', 'store_manager', 'staff'] },
        ],
    },
    {
        title: 'Fleet & Inventory',
        roles: ['super_admin', 'store_manager'],
        items: [
            { label: 'Fleet Inventory', path: '/admin/bikes', icon: <TwoWheelerIcon />, roles: ['super_admin', 'store_manager'] },
            { label: 'Maintenance & Status', path: '/admin/maintenance', icon: <BuildCircleIcon />, roles: ['super_admin', 'store_manager'] },
            { label: 'Offline Sync Queue', path: '/admin/sync', icon: <SyncIcon />, roles: ['super_admin', 'store_manager'] },
        ],
    },
    {
        title: 'HQ Administration',
        roles: ['super_admin', 'store_manager'],
        items: [
            { label: 'Stores & Hubs', path: '/admin/stores', icon: <StorefrontIcon />, roles: ['super_admin'] },
            { label: 'Dynamic Pricing', path: '/admin/pricing', icon: <TrendingUpIcon />, roles: ['super_admin'] },
            { label: 'Discount Coupons', path: '/admin/coupons', icon: <LocalOfferIcon />, roles: ['super_admin'] },
            { label: 'Staff Management', path: '/admin/staff', icon: <BadgeIcon />, roles: ['super_admin'] },
            { label: 'Reports & Analytics', path: '/admin/reports', icon: <AssessmentIcon />, roles: ['super_admin', 'store_manager'] },
            { label: 'Activity Logs', path: '/admin/activity-logs', icon: <HistoryIcon />, roles: ['super_admin'] },
        ],
    },
];

export default function AdminLayout({ children, title, currentStore }) {
    const { auth, url } = usePage().props;
    const user = auth?.user;
    const userRole = user?.role || 'staff';

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        router.post('/admin/logout');
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'super_admin':
                return { label: 'Super Admin', color: 'secondary' };
            case 'store_manager':
                return { label: 'Store Manager', color: 'primary' };
            case 'staff':
                return { label: 'Hub Staff', color: 'info' };
            default:
                return { label: role, color: 'default' };
        }
    };

    const roleBadge = getRoleBadge(userRole);

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0F172A', color: '#F8FAFC' }}>
            {/* Header Brand */}
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #1E293B' }}>
                <Box
                    sx={{
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText',
                        p: 0.8,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ElectricBoltIcon fontSize="small" />
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                        GkWhizWheel
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Ops & Admin Shell
                    </Typography>
                </Box>
            </Box>

            {/* Navigation Lists */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1.5 }}>
                {MENU_SECTIONS.filter((section) => section.roles.includes(userRole)).map((section) => (
                    <Box key={section.title} sx={{ mb: 1.5 }}>
                        <ListSubheader
                            sx={{
                                bgcolor: 'transparent',
                                color: '#64748B',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                lineHeight: '24px',
                                px: 2.5,
                            }}
                        >
                            {section.title}
                        </ListSubheader>
                        <List dense disablePadding>
                            {section.items
                                .filter((item) => item.roles.includes(userRole))
                                .map((item) => {
                                    const isCurrent = url === item.path || (item.path !== '/admin/dashboard' && url.startsWith(item.path));
                                    return (
                                        <ListItem key={item.label} disablePadding sx={{ px: 1.5, py: 0.2 }}>
                                            <ListItemButton
                                                component={Link}
                                                href={item.path}
                                                selected={isCurrent}
                                                onClick={() => setMobileOpen(false)}
                                                sx={{
                                                    borderRadius: 2,
                                                    py: 1,
                                                    px: 1.5,
                                                    color: isCurrent ? '#FFFFFF' : '#94A3B8',
                                                    bgcolor: isCurrent ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                                    borderLeft: isCurrent ? '3px solid #F59E0B' : '3px solid transparent',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                        color: '#FFFFFF',
                                                    },
                                                    '&.Mui-selected': {
                                                        bgcolor: 'rgba(245, 158, 11, 0.15)',
                                                        color: '#FFFFFF',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(245, 158, 11, 0.22)',
                                                        },
                                                    },
                                                }}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 36,
                                                        color: isCurrent ? '#F59E0B' : '#94A3B8',
                                                    }}
                                                >
                                                    {item.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{
                                                        fontSize: '0.875rem',
                                                        fontWeight: isCurrent ? 700 : 500,
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* Sidebar User Footer */}
            <Divider sx={{ borderColor: '#1E293B' }} />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: '#000', width: 36, height: 36, fontWeight: 700 }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                        {user?.name || 'Administrator'}
                    </Typography>
                    <Chip
                        label={roleBadge.label}
                        color={roleBadge.color}
                        size="small"
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.3 }}
                    />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <CssBaseline />

            {/* Top AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ display: { md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                            {title || 'Dashboard'}
                        </Typography>
                    </Box>

                    {/* Right Controls */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {/* Hub Scope Indicator */}
                        <Chip
                            icon={<StoreIcon sx={{ fontSize: '1rem !important' }} />}
                            label={
                                userRole === 'super_admin'
                                    ? 'HQ (All Hubs)'
                                    : currentStore
                                    ? `${currentStore.name} (${currentStore.code})`
                                    : 'Default Hub'
                            }
                            variant="outlined"
                            size="small"
                            sx={{
                                fontWeight: 600,
                                borderColor: 'primary.light',
                                bgcolor: 'primary.50',
                                color: 'primary.dark',
                                display: { xs: 'none', sm: 'inline-flex' },
                            }}
                        />

                        {/* Customer Portal Link */}
                        <Tooltip title="View Customer Website">
                            <IconButton component={Link} href="/" size="small" color="primary">
                                <OpenInNewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {/* Profile Avatar Button */}
                        <IconButton onClick={handleProfileMenuOpen} size="small">
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </Avatar>
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleProfileMenuClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: { width: 220, p: 1, borderRadius: 2 },
                            }}
                        >
                            <Box sx={{ px: 1.5, py: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {user?.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    {user?.email || user?.phone}
                                </Typography>
                                <Chip
                                    label={roleBadge.label}
                                    color={roleBadge.color}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mt: 0.5 }}
                                />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <MenuItem component={Link} href="/" onClick={handleProfileMenuClose}>
                                <ListItemIcon>
                                    <OpenInNewIcon fontSize="small" />
                                </ListItemIcon>
                                Customer Site
                            </MenuItem>
                            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                <ListItemIcon sx={{ color: 'error.main' }}>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                Sign Out
                            </MenuItem>
                        </Menu>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawers */}
            <Box
                component="nav"
                sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
                aria-label="admin navigation"
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
                    }}
                >
                    {drawerContent}
                </Drawer>

                {/* Desktop Permanent Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 4 },
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: '64px',
                    minHeight: 'calc(100vh - 64px)',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

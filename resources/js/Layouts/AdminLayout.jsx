import React, { useState, useEffect } from 'react';
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
    Toolbar,
    Typography,
    Chip,
    Avatar,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Tooltip,
    Collapse,
    Breadcrumbs,
    Button,
    Badge as MuiBadge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputBase,
    BottomNavigation,
    BottomNavigationAction,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BadgeIcon from '@mui/icons-material/Badge';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import StoreIcon from '@mui/icons-material/Store';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import IosShareIcon from '@mui/icons-material/IosShare';
import AppShortcutIcon from '@mui/icons-material/AppShortcut';
import Alert from '@mui/material/Alert';
import { useColorMode } from '../theme/ColorModeContext';

const DRAWER_WIDTH = 268;

const MENU_SECTIONS = [
    {
        title: 'Core & Overview',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Dashboard',
                path: '/admin/dashboard',
                icon: <DashboardIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
            },
            {
                label: 'Ground Pass Scanner',
                path: '/admin/check-in',
                icon: <QrCodeScannerIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
            },
            {
                label: 'Visual Dispatch Board',
                path: '/admin/dispatch',
                icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
            },
        ],
    },
    {
        title: 'Two-Wheeler Rentals',
        serviceSlug: 'two_wheelers',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Fleet & Bikes',
                icon: <TwoWheelerIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/bikes',
                children: [
                    { label: 'All Fleet Inventory', path: '/admin/bikes', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add New Bike', path: '/admin/bikes/create', roles: ['super_admin', 'store_manager'] },
                    { label: 'Dynamic Tariffs', path: '/admin/pricing', roles: ['super_admin'] },
                    { label: 'Discount Coupons', path: '/admin/coupons', roles: ['super_admin'] },
                ],
            },
            {
                label: 'Bike Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/bookings',
                children: [
                    { label: 'All Bike Bookings', path: '/admin/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Pickups & Handover', path: '/admin/bookings?status=confirmed', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Returns Due / Active', path: '/admin/bookings?status=handed_over', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Rental', path: '/admin/services/two_wheelers/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'Taxi & Cab Services',
        serviceSlug: 'taxi',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Cab Fleet & Drivers',
                icon: <LocalTaxiIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/taxi/items',
                children: [
                    { label: 'All Cabs & Vehicles', path: '/admin/services/taxi/items', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add New Vehicle', path: '/admin/services/taxi/items/create', roles: ['super_admin', 'store_manager'] },
                ],
            },
            {
                label: 'Taxi Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/taxi/bookings',
                children: [
                    { label: 'All Taxi Bookings', path: '/admin/services/taxi/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Booking', path: '/admin/services/taxi/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'Backwater Boating',
        serviceSlug: 'boating',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Boats & Cruises',
                icon: <DirectionsBoatIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/boating/items',
                children: [
                    { label: 'All Boats & Packages', path: '/admin/services/boating/items', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add Boat Package', path: '/admin/services/boating/items/create', roles: ['super_admin', 'store_manager'] },
                ],
            },
            {
                label: 'Boating Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/boating/bookings',
                children: [
                    { label: 'All Boating Bookings', path: '/admin/services/boating/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Booking', path: '/admin/services/boating/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'Netrani Scuba Diving',
        serviceSlug: 'scuba',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Dive Packages & Batches',
                icon: <ScubaDivingIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/scuba/items',
                children: [
                    { label: 'All Dive Offerings', path: '/admin/services/scuba/items', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add Dive Package', path: '/admin/services/scuba/items/create', roles: ['super_admin', 'store_manager'] },
                ],
            },
            {
                label: 'Scuba Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/scuba/bookings',
                children: [
                    { label: 'All Scuba Bookings', path: '/admin/services/scuba/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Booking', path: '/admin/services/scuba/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'Coastal Homestays',
        serviceSlug: 'homestay',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Rooms & Properties',
                icon: <HomeWorkIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/homestay/items',
                children: [
                    { label: 'All Homestay Rooms', path: '/admin/services/homestay/items', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add Homestay Room', path: '/admin/services/homestay/items/create', roles: ['super_admin', 'store_manager'] },
                ],
            },
            {
                label: 'Homestay Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/homestay/bookings',
                children: [
                    { label: 'All Stay Bookings', path: '/admin/services/homestay/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Booking', path: '/admin/services/homestay/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'Local Travel Guide',
        serviceSlug: 'guide',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Guides & Trails',
                icon: <ExploreIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/guide/items',
                children: [
                    { label: 'All Guide Packages', path: '/admin/services/guide/items', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add Guide Profile', path: '/admin/services/guide/items/create', roles: ['super_admin', 'store_manager'] },
                ],
            },
            {
                label: 'Guide Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/guide/bookings',
                children: [
                    { label: 'All Guide Bookings', path: '/admin/services/guide/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Booking', path: '/admin/services/guide/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'Karnataka Tour Packages',
        serviceSlug: 'tours',
        roles: ['super_admin', 'store_manager', 'staff'],
        items: [
            {
                label: 'Tour Itineraries',
                icon: <LuggageIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/tours/items',
                children: [
                    { label: 'All Tour Circuits', path: '/admin/services/tours/items', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: 'Add Tour Package', path: '/admin/services/tours/items/create', roles: ['super_admin', 'store_manager'] },
                ],
            },
            {
                label: 'Tour Bookings',
                icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager', 'staff'],
                basePath: '/admin/services/tours/bookings',
                children: [
                    { label: 'All Tour Bookings', path: '/admin/services/tours/bookings', roles: ['super_admin', 'store_manager', 'staff'] },
                    { label: '+ New Offline Booking', path: '/admin/services/tours/bookings/create', roles: ['super_admin', 'store_manager', 'staff'] },
                ],
            },
        ],
    },
    {
        title: 'HQ Administration',
        roles: ['super_admin', 'store_manager'],
        items: [
            {
                label: 'Stores & Hubs',
                icon: <StorefrontIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin'],
                basePath: '/admin/stores',
                children: [
                    { label: 'All Hub Locations', path: '/admin/stores', roles: ['super_admin'] },
                    { label: 'Add New Hub', path: '/admin/stores/create', roles: ['super_admin'] },
                ],
            },
            {
                label: 'Staff Management',
                path: '/admin/staff',
                icon: <BadgeIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin'],
            },
            {
                label: 'Service Categories',
                path: '/admin/services/categories',
                icon: <CategoryIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager'],
            },
            {
                label: 'Reports & Analytics',
                path: '/admin/reports',
                icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
                roles: ['super_admin', 'store_manager'],
            },
        ],
    },
];

// Helper to resolve live count for sidebar items
const getCountForItem = (itemLabel, serviceSlug, sidebarCounts) => {
    if (!sidebarCounts) return 0;
    const lower = itemLabel.toLowerCase();

    // Do not show count badge on "create" or "+ new" action links
    if (lower.includes('+ new') || lower.includes('add ') || lower.includes('create')) {
        return 0;
    }

    if (serviceSlug) {
        if (lower.includes('booking')) {
            return Number(sidebarCounts.services?.[serviceSlug] || 0);
        }
    }

    if (itemLabel === 'Bike Bookings' || itemLabel === 'All Bike Bookings') {
        return Number(sidebarCounts.bikes?.total || 0);
    }
    if (itemLabel === 'Pickups & Handover') {
        return Number(sidebarCounts.bikes?.pickups || 0);
    }
    if (itemLabel === 'Returns Due / Active') {
        return Number(sidebarCounts.bikes?.returns || 0);
    }
    if (itemLabel === 'Staff Management') {
        return Number(sidebarCounts.staff || 0);
    }

    return 0;
};

// Helper to resolve aggregate count for section headers
const getCountForSection = (section, sidebarCounts) => {
    if (!sidebarCounts) return 0;
    if (section.serviceSlug) {
        return Number(sidebarCounts.services?.[section.serviceSlug] || 0);
    }
    if (section.title === 'Two-Wheeler Rentals') {
        return Number(sidebarCounts.bikes?.total || 0);
    }
    return 0;
};

export default function AdminLayout({ children, title, currentStore }) {
    const { auth, sidebar_counts, flash } = usePage().props;
    const { url = '' } = usePage();
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';
    const user = auth?.user;
    const userRole = user?.role || 'staff';
    const assignedServices = user?.assigned_services || [];

    const isSectionAuthorized = (section) => {
        if (!section.roles.includes(userRole)) return false;
        if (userRole === 'super_admin') return true;
        if (section.serviceSlug) {
            return assignedServices.includes(section.serviceSlug);
        }
        return true;
    };

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [newBookingAnchor, setNewBookingAnchor] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // PWA Install state
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIosInstallModal, setShowIosInstallModal] = useState(false);

    useEffect(() => {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        setIsStandalone(isStandaloneMode);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstallPrompt(null);
            }
        } else {
            setShowIosInstallModal(true);
        }
    };

    // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Initial state: expand any submenu whose child matches current URL or starts with basePath
    const [openSubmenus, setOpenSubmenus] = useState(() => {
        const initialState = {};
        MENU_SECTIONS.filter(isSectionAuthorized).forEach((section) => {
            section.items.forEach((item) => {
                if (item.children) {
                    const hasActiveChild = item.children.some(
                        (child) => url === child.path || (item.basePath && url.startsWith(item.basePath))
                    );
                    initialState[item.label] = hasActiveChild;
                }
            });
        });
        return initialState;
    });

    // Keep active submenu expanded when URL changes
    useEffect(() => {
        MENU_SECTIONS.filter(isSectionAuthorized).forEach((section) => {
            section.items.forEach((item) => {
                if (item.children) {
                    const hasActiveChild = item.children.some(
                        (child) => url === child.path || (item.basePath && url.startsWith(item.basePath))
                    );
                    if (hasActiveChild) {
                        setOpenSubmenus((prev) => ({ ...prev, [item.label]: true }));
                    }
                }
            });
        });
    }, [url]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const toggleSubmenu = (label) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
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
                return { label: 'Service Lead', color: 'primary' };
            case 'staff':
                return { label: 'Counter Staff', color: 'info' };
            default:
                return { label: role, color: 'default' };
        }
    };

    const roleBadge = getRoleBadge(userRole);

    // Total actionable bookings across all services
    const totalActiveBookings = (sidebar_counts?.bikes?.total || 0) + (sidebar_counts?.services_total || 0);

    // Build intelligent breadcrumbs based on URL & title
    const getBreadcrumbs = () => {
        const crumbs = [{ label: 'Console', path: '/admin/dashboard' }];
        if (url.startsWith('/admin/bikes')) {
            crumbs.push({ label: 'Fleet & Bikes', path: '/admin/bikes' });
            if (url.includes('/create')) crumbs.push({ label: 'Add Bike', path: null });
            else if (url.includes('/edit')) crumbs.push({ label: 'Edit Vehicle', path: null });
        } else if (url.startsWith('/admin/bookings')) {
            crumbs.push({ label: 'Bookings', path: '/admin/bookings' });
            if (url.includes('status=confirmed')) crumbs.push({ label: 'Pickups', path: null });
            else if (url.includes('status=handed_over')) crumbs.push({ label: 'Returns', path: null });
        } else if (url.startsWith('/admin/stores')) {
            crumbs.push({ label: 'Stores & Hubs', path: '/admin/stores' });
        } else if (url.startsWith('/admin/pricing')) {
            crumbs.push({ label: 'Pricing Rules', path: '/admin/pricing' });
        } else if (url.startsWith('/admin/coupons')) {
            crumbs.push({ label: 'Discount Coupons', path: '/admin/coupons' });
        } else if (url.startsWith('/admin/staff')) {
            crumbs.push({ label: 'Staff Team', path: '/admin/staff' });
        } else if (url.startsWith('/admin/services/')) {
            const parts = url.split('/');
            const serviceSlug = parts[3] || '';
            const serviceTitles = {
                two_wheelers: 'Two-Wheelers',
                taxi: 'Taxi & Cabs',
                boating: 'Backwater Boating',
                scuba: 'Scuba Diving',
                homestay: 'Coastal Homestays',
                guide: 'Travel Guide',
                tours: 'Tour Packages',
            };
            const sTitle = serviceTitles[serviceSlug] || 'Service';
            crumbs.push({ label: sTitle, path: `/admin/services/${serviceSlug}/bookings` });
            if (url.includes('/items')) crumbs.push({ label: 'Inventory Items', path: `/admin/services/${serviceSlug}/items` });
            else if (url.includes('/bookings/create')) crumbs.push({ label: 'New Counter Booking', path: null });
            else if (url.includes('/bookings')) crumbs.push({ label: 'Bookings', path: `/admin/services/${serviceSlug}/bookings` });
        } else if (url.startsWith('/admin/reports')) {
            crumbs.push({ label: 'Reports & Analytics', path: '/admin/reports' });
        } else if (url === '/admin/dashboard' || url === '/admin') {
            crumbs.push({ label: 'Dashboard', path: null });
        }
        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // Palette & Tokens for Professional Tool Design
    const sidebarBg = isDark ? '#0B0F19' : '#FFFFFF';
    const sidebarBorder = isDark ? '#1F2937' : '#E2E8F0';
    const subheaderColor = isDark ? '#64748B' : '#64748B';
    const parentInactiveColor = isDark ? '#94A3B8' : '#475569';
    const parentActiveColor = isDark ? '#F8FAFC' : '#0F172A';
    const parentHoverBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)';
    const childActiveColor = isDark ? '#FBBF24' : '#B45309';
    const childInactiveColor = isDark ? '#94A3B8' : '#64748B';
    const childActiveBg = isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.1)';
    const childHoverBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
    const footerBg = isDark ? '#0F172A' : '#F8FAFC';

    // Quick booking service items for the + New Booking dropdown
    const quickBookingServices = [
        { label: 'Two-Wheeler Rental', slug: 'two_wheelers', icon: <TwoWheelerIcon fontSize="small" /> },
        { label: 'Taxi & Cab Fleet', slug: 'taxi', icon: <LocalTaxiIcon fontSize="small" /> },
        { label: 'Backwater Boating', slug: 'boating', icon: <DirectionsBoatIcon fontSize="small" /> },
        { label: 'Netrani Scuba Diving', slug: 'scuba', icon: <ScubaDivingIcon fontSize="small" /> },
        { label: 'Coastal Homestay', slug: 'homestay', icon: <HomeWorkIcon fontSize="small" /> },
        { label: 'Travel Guide Trail', slug: 'guide', icon: <ExploreIcon fontSize="small" /> },
        { label: 'Tour Package', slug: 'tours', icon: <LuggageIcon fontSize="small" /> },
    ].filter(s => userRole === 'super_admin' || assignedServices.includes(s.slug));

    // Command palette search quick links
    const commandLinks = [
        { label: 'Dashboard & Live Operations', path: '/admin/dashboard', icon: <DashboardIcon fontSize="small" /> },
        { label: 'Visual Dispatch & Schedule Board', path: '/admin/dispatch', icon: <CalendarMonthIcon fontSize="small" /> },
        { label: 'Two-Wheeler Bookings', path: '/admin/bookings', icon: <ReceiptLongIcon fontSize="small" /> },
        { label: '+ New Two-Wheeler Rental', path: '/admin/services/two_wheelers/bookings/create', icon: <AddIcon fontSize="small" /> },
        { label: 'Taxi & Cab Bookings', path: '/admin/services/taxi/bookings', icon: <LocalTaxiIcon fontSize="small" /> },
        { label: 'Boating Cruises & Safaris', path: '/admin/services/boating/bookings', icon: <DirectionsBoatIcon fontSize="small" /> },
        { label: 'Netrani Scuba Batches', path: '/admin/services/scuba/bookings', icon: <ScubaDivingIcon fontSize="small" /> },
        { label: 'Coastal Homestay Rooms', path: '/admin/services/homestay/bookings', icon: <HomeWorkIcon fontSize="small" /> },
        { label: 'Local Guides & Trails', path: '/admin/services/guide/bookings', icon: <ExploreIcon fontSize="small" /> },
        { label: 'Tour Packages & Circuits', path: '/admin/services/tours/bookings', icon: <LuggageIcon fontSize="small" /> },
        { label: 'Staff Management & Access', path: '/admin/staff', icon: <BadgeIcon fontSize="small" /> },
        { label: 'Business Reports & Analytics', path: '/admin/reports', icon: <AssessmentIcon fontSize="small" /> },
    ].filter(link => searchQuery ? link.label.toLowerCase().includes(searchQuery.toLowerCase()) : true);

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: sidebarBg, color: parentActiveColor }}>
            {/* Header Brand Workspace Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${sidebarBorder}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: isDark ? 'background.paper' : 'grey.900',
                            color: 'warning.main',
                            borderRadius: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            flexShrink: 0,
                        }}
                    >
                        <ElectricBoltIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'text.primary' }}>
                            GK WhizWheel
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.2 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', boxShadow: (t) => `0 0 6px ${t.palette.success.main}` }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Ops Console
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
                <Chip
                    label="PRO"
                    size="small"
                    sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)',
                        color: isDark ? '#FBBF24' : '#B45309',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                />
            </Box>

            {/* Quick Command Trigger in Sidebar */}
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Box
                    onClick={() => setSearchOpen(true)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.2,
                        py: 0.7,
                        borderRadius: 1.8,
                        border: `1px solid ${sidebarBorder}`,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                        color: 'text.secondary',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            borderColor: 'warning.main',
                            color: 'text.primary',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500 }}>Quick Jump...</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, bgcolor: isDark ? '#1E293B' : '#E2E8F0', px: 0.6, py: 0.1, borderRadius: 1 }}>
                        ⌘K
                    </Typography>
                </Box>
            </Box>

            {/* Navigation Lists */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
                {MENU_SECTIONS.filter(isSectionAuthorized).map((section) => {
                    const sectionCount = getCountForSection(section, sidebar_counts);
                    return (
                        <Box key={section.title} sx={{ mb: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.2, py: 0.4 }}>
                                <Typography
                                    sx={{
                                        color: subheaderColor,
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    {section.title}
                                </Typography>
                                {sectionCount > 0 && (
                                    <Box
                                        sx={{
                                            fontSize: '0.62rem',
                                            fontWeight: 800,
                                            color: isDark ? '#FBBF24' : '#B45309',
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                                            px: 0.7,
                                            py: 0.1,
                                            borderRadius: 10,
                                            border: '1px solid rgba(245, 158, 11, 0.25)',
                                        }}
                                    >
                                        {sectionCount}
                                    </Box>
                                )}
                            </Box>
                            <List dense disablePadding>
                                {section.items
                                    .filter((item) => item.roles.includes(userRole))
                                    .map((item) => {
                                        const itemCount = getCountForItem(item.label, section.serviceSlug, sidebar_counts);

                                        // 1. If item has subpages/children -> Render as Collapsible Tree
                                        if (item.children && item.children.length > 0) {
                                            const visibleChildren = item.children.filter((child) => child.roles.includes(userRole));
                                            if (visibleChildren.length === 0) return null;

                                            const isParentActive = visibleChildren.some((child) =>
                                                child.path.includes('?')
                                                    ? url === child.path
                                                    : url === child.path || (item.basePath && url.startsWith(item.basePath))
                                            );
                                            const isOpen = Boolean(openSubmenus[item.label]);

                                            return (
                                                <React.Fragment key={item.label}>
                                                    <ListItem disablePadding sx={{ px: 1.2, py: 0.15 }}>
                                                        <ListItemButton
                                                            onClick={() => toggleSubmenu(item.label)}
                                                            sx={{
                                                                borderRadius: 1.8,
                                                                py: 0.8,
                                                                px: 1.2,
                                                                color: isParentActive ? parentActiveColor : parentInactiveColor,
                                                                bgcolor: isParentActive ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                                                                borderLeft: isParentActive ? '3px solid #F59E0B' : '3px solid transparent',
                                                                '&:hover': {
                                                                    bgcolor: parentHoverBg,
                                                                    color: parentActiveColor,
                                                                },
                                                            }}
                                                        >
                                                            <ListItemIcon
                                                                sx={{
                                                                    minWidth: 32,
                                                                    color: isParentActive ? '#F59E0B' : parentInactiveColor,
                                                                }}
                                                            >
                                                                {item.icon}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={item.label}
                                                                primaryTypographyProps={{
                                                                    fontSize: '0.84rem',
                                                                    fontWeight: isParentActive ? 700 : 500,
                                                                    color: isParentActive ? parentActiveColor : parentInactiveColor,
                                                                }}
                                                            />
                                                            {/* Count Badge on Parent Menu */}
                                                            {itemCount > 0 && (
                                                                <Box
                                                                    sx={{
                                                                        px: 0.8,
                                                                        py: 0.15,
                                                                        borderRadius: 10,
                                                                        fontSize: '0.68rem',
                                                                        fontWeight: 800,
                                                                        lineHeight: 1.2,
                                                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.14)',
                                                                        color: isDark ? '#FBBF24' : '#B45309',
                                                                        border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.25)',
                                                                        mr: 0.6,
                                                                        minWidth: 20,
                                                                        textAlign: 'center',
                                                                    }}
                                                                >
                                                                    {itemCount}
                                                                </Box>
                                                            )}
                                                            {isOpen ? (
                                                                <ExpandLessIcon sx={{ fontSize: '1.1rem', color: isParentActive ? '#F59E0B' : parentInactiveColor }} />
                                                            ) : (
                                                                <ExpandMoreIcon sx={{ fontSize: '1.1rem', color: parentInactiveColor }} />
                                                            )}
                                                        </ListItemButton>
                                                    </ListItem>

                                                    {/* Subpages Collapse with Vertical Guide Rail */}
                                                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                                        <Box
                                                            sx={{
                                                                ml: 3.5,
                                                                pl: 1,
                                                                pr: 1.2,
                                                                py: 0.4,
                                                                borderLeft: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                                                            }}
                                                        >
                                                            {visibleChildren.map((child) => {
                                                                const isChildActive = child.path.includes('?')
                                                                    ? url === child.path
                                                                    : url === child.path || (child.path !== '/admin/dashboard' && url.startsWith(child.path) && !url.includes('?'));

                                                                const childCount = getCountForItem(child.label, section.serviceSlug, sidebar_counts);

                                                                return (
                                                                    <ListItemButton
                                                                        key={child.label}
                                                                        component={Link}
                                                                        href={child.path}
                                                                        selected={isChildActive}
                                                                        onClick={() => setMobileOpen(false)}
                                                                        sx={{
                                                                            borderRadius: 1.5,
                                                                            py: 0.65,
                                                                            px: 1.2,
                                                                            mb: 0.2,
                                                                            color: isChildActive ? childActiveColor : childInactiveColor,
                                                                            bgcolor: isChildActive ? childActiveBg : 'transparent',
                                                                            '&:hover': {
                                                                                bgcolor: childHoverBg,
                                                                                color: childActiveColor,
                                                                            },
                                                                            '&.Mui-selected': {
                                                                                bgcolor: childActiveBg,
                                                                                color: childActiveColor,
                                                                                '&:hover': {
                                                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.16)',
                                                                                },
                                                                            },
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            sx={{
                                                                                width: 5,
                                                                                height: 5,
                                                                                borderRadius: '50%',
                                                                                bgcolor: isChildActive ? '#F59E0B' : (isDark ? '#475569' : '#CBD5E1'),
                                                                                mr: 1.4,
                                                                                flexShrink: 0,
                                                                                boxShadow: isChildActive ? '0 0 6px #F59E0B' : 'none',
                                                                            }}
                                                                        />
                                                                        <ListItemText
                                                                            primary={child.label}
                                                                            primaryTypographyProps={{
                                                                                fontSize: '0.8rem',
                                                                                fontWeight: isChildActive ? 700 : 500,
                                                                                color: isChildActive ? childActiveColor : childInactiveColor,
                                                                            }}
                                                                        />
                                                                        {childCount > 0 && (
                                                                            <Box
                                                                                sx={{
                                                                                    px: 0.6,
                                                                                    py: 0.1,
                                                                                    borderRadius: 10,
                                                                                    fontSize: '0.64rem',
                                                                                    fontWeight: 800,
                                                                                    lineHeight: 1.2,
                                                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)',
                                                                                    color: isDark ? '#FBBF24' : '#B45309',
                                                                                    ml: 'auto',
                                                                                    flexShrink: 0,
                                                                                }}
                                                                            >
                                                                                {childCount}
                                                                            </Box>
                                                                        )}
                                                                    </ListItemButton>
                                                                );
                                                            })}
                                                        </Box>
                                                    </Collapse>
                                                </React.Fragment>
                                            );
                                        }

                                        // 2. Direct Single Link
                                        const isCurrent = url === item.path || (item.path !== '/admin/dashboard' && url.startsWith(item.path));
                                        return (
                                            <ListItem key={item.label} disablePadding sx={{ px: 1.2, py: 0.15 }}>
                                                <ListItemButton
                                                    component={Link}
                                                    href={item.path}
                                                    selected={isCurrent}
                                                    onClick={() => setMobileOpen(false)}
                                                    sx={{
                                                        borderRadius: 1.8,
                                                        py: 0.8,
                                                        px: 1.2,
                                                        color: isCurrent ? (isDark ? '#FFFFFF' : '#0F172A') : parentInactiveColor,
                                                        bgcolor: isCurrent ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)') : 'transparent',
                                                        borderLeft: isCurrent ? '3px solid #F59E0B' : '3px solid transparent',
                                                        '&:hover': {
                                                            bgcolor: parentHoverBg,
                                                            color: parentActiveColor,
                                                        },
                                                        '&.Mui-selected': {
                                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                                        },
                                                    }}
                                                >
                                                    <ListItemIcon
                                                        sx={{
                                                            minWidth: 32,
                                                            color: isCurrent ? '#F59E0B' : parentInactiveColor,
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={item.label}
                                                        primaryTypographyProps={{
                                                            fontSize: '0.84rem',
                                                            fontWeight: isCurrent ? 700 : 500,
                                                            color: isCurrent ? (isDark ? '#FFFFFF' : '#0F172A') : parentInactiveColor,
                                                        }}
                                                    />
                                                    {itemCount > 0 && (
                                                        <Box
                                                            sx={{
                                                                px: 0.8,
                                                                py: 0.15,
                                                                borderRadius: 10,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 800,
                                                                lineHeight: 1.2,
                                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.14)',
                                                                color: isDark ? '#FBBF24' : '#B45309',
                                                                border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.25)',
                                                                ml: 'auto',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {itemCount}
                                                        </Box>
                                                    )}
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                            </List>
                        </Box>
                    );
                })}
            </Box>

            {/* PWA Ops App Install Callout */}
            {!isStandalone && (
                <Box sx={{ px: 1.8, py: 1 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.07)',
                            border: '1px dashed',
                            borderColor: 'warning.main',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    bgcolor: 'warning.main',
                                    color: 'grey.900',
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <InstallMobileIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                                    WhizWheel App
                                </Typography>
                                <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                    Offline scanner & dispatch
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            size="small"
                            variant="contained"
                            color="secondary"
                            onClick={handleInstallClick}
                            startIcon={<AppShortcutIcon sx={{ fontSize: 14 }} />}
                            sx={{
                                py: 0.4,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                borderRadius: 1.5,
                                textTransform: 'none',
                            }}
                        >
                            Install Ops App
                        </Button>
                    </Paper>
                </Box>
            )}

            {/* Sidebar User Footer */}
            <Divider sx={{ borderColor: sidebarBorder }} />
            <Box sx={{ p: 1.8, bgcolor: footerBg, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                    sx={{
                        bgcolor: isDark ? 'background.paper' : 'grey.900',
                        color: 'warning.main',
                        width: 36,
                        height: 36,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary' }}>
                        {user?.name || 'Administrator'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem' }}>
                        {roleBadge.label}
                    </Typography>
                </Box>
                <Tooltip title="Sign Out">
                    <IconButton
                        size="small"
                        onClick={handleLogout}
                        sx={{
                            color: 'error.main',
                            bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                            '&:hover': {
                                bgcolor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.18)',
                            },
                        }}
                    >
                        <LogoutIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <CssBaseline />

            {/* Top Professional Tool AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    bgcolor: isDark ? 'rgba(11, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(16px)',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.02)',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 2.5 }, minHeight: '58px !important', height: 58 }}>
                    {/* Left: Mobile Toggle & Dynamic Breadcrumbs */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ display: { md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Box sx={{ minWidth: 0 }}>
                            <Breadcrumbs
                                separator={<NavigateNextIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />}
                                sx={{ display: { xs: 'none', sm: 'flex' } }}
                            >
                                {breadcrumbs.map((crumb, idx) => {
                                    const isLast = idx === breadcrumbs.length - 1;
                                    return isLast ? (
                                        <Typography
                                            key={crumb.label}
                                            variant="caption"
                                            sx={{
                                                color: isDark ? '#FBBF24' : '#B45309',
                                                fontWeight: 800,
                                                fontSize: '0.74rem',
                                            }}
                                        >
                                            {crumb.label}
                                        </Typography>
                                    ) : (
                                        <Typography
                                            key={crumb.label}
                                            component={crumb.path ? Link : 'span'}
                                            href={crumb.path || undefined}
                                            variant="caption"
                                            sx={{
                                                color: 'text.secondary',
                                                textDecoration: 'none',
                                                fontSize: '0.74rem',
                                                fontWeight: 600,
                                                '&:hover': crumb.path ? { color: 'text.primary', textDecoration: 'underline' } : {},
                                            }}
                                        >
                                            {crumb.label}
                                        </Typography>
                                    );
                                })}
                            </Breadcrumbs>

                            <Typography
                                variant="subtitle1"
                                noWrap
                                sx={{
                                    fontWeight: 800,
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.1,
                                    color: 'text.primary',
                                }}
                            >
                                {title || 'Operations Console'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Center: Interactive Search Trigger for Tool Feel */}
                    <Box
                        onClick={() => setSearchOpen(true)}
                        sx={{
                            display: { xs: 'none', lg: 'flex' },
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.8,
                            py: 0.6,
                            borderRadius: 2,
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'}`,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                            color: 'text.secondary',
                            cursor: 'pointer',
                            minWidth: 260,
                            transition: 'all 0.15s ease',
                            '&:hover': {
                                borderColor: 'warning.main',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                            },
                        }}
                    >
                        <SearchIcon sx={{ fontSize: 16 }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, flexGrow: 1 }}>
                            Search bookings, fleet, guests...
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, bgcolor: isDark ? '#1E293B' : '#E2E8F0', px: 0.7, py: 0.15, borderRadius: 1 }}>
                            ⌘K
                        </Typography>
                    </Box>

                    {/* Right Controls & Quick Actions */}
                    <Stack direction="row" spacing={{ xs: 0.6, sm: 1.2 }} alignItems="center">
                        {/* Live Operational Status Indicator */}
                        <Box
                            sx={{
                                display: { xs: 'none', md: 'flex' },
                                alignItems: 'center',
                                gap: 0.7,
                                px: 1.2,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#F0FDF4',
                                border: '1px solid rgba(34, 197, 94, 0.25)',
                            }}
                        >
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', boxShadow: (t) => `0 0 6px ${t.palette.success.main}` }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'success.main' }}>
                                7 Services Online
                            </Typography>
                        </Box>

                        {/* Quick Ground Scanner Button */}
                        <Button
                            component={Link}
                            href="/admin/check-in"
                            variant="outlined"
                            size="small"
                            startIcon={<QrCodeScannerIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                borderRadius: 1.8,
                                fontWeight: 800,
                                textTransform: 'none',
                                fontSize: '0.78rem',
                                color: isDark ? '#34D399' : '#059669',
                                borderColor: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                                '&:hover': {
                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                                    borderColor: 'success.main',
                                },
                            }}
                        >
                            Scan Pass
                        </Button>

                        {/* Quick 1-Click New Booking Button */}
                        <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<AddIcon />}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setNewBookingAnchor(e.currentTarget)}
                            sx={{
                                borderRadius: 1.8,
                                fontWeight: 800,
                                textTransform: 'none',
                                fontSize: '0.78rem',
                                px: 1.6,
                                py: 0.6,
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                },
                            }}
                        >
                            New Booking
                        </Button>

                        <Menu
                            anchorEl={newBookingAnchor}
                            open={Boolean(newBookingAnchor)}
                            onClose={() => setNewBookingAnchor(null)}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: { width: 230, p: 0.5, borderRadius: 2.5 },
                            }}
                        >
                            <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                                Counter Reservation
                            </Typography>
                            {quickBookingServices.map((srv) => (
                                <MenuItem
                                    key={srv.slug}
                                    component={Link}
                                    href={`/admin/services/${srv.slug}/bookings/create`}
                                    onClick={() => setNewBookingAnchor(null)}
                                    sx={{ borderRadius: 1.5, gap: 1.2, py: 0.9, fontSize: '0.82rem', fontWeight: 600 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 26, color: 'warning.main' }}>
                                        {srv.icon}
                                    </ListItemIcon>
                                    {srv.label}
                                </MenuItem>
                            ))}
                        </Menu>

                        {/* Notifications Bell with Total Unread Count */}
                        <Tooltip title={`${totalActiveBookings} Active Reservations`}>
                            <IconButton
                                component={Link}
                                href="/admin/bookings"
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'action.selected',
                                        color: 'warning.main',
                                    },
                                }}
                            >
                                <MuiBadge
                                    badgeContent={totalActiveBookings}
                                    color="secondary"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.65rem',
                                            height: 16,
                                            minWidth: 16,
                                            fontWeight: 900,
                                        },
                                    }}
                                >
                                    <NotificationsNoneIcon sx={{ fontSize: 19 }} />
                                </MuiBadge>
                            </IconButton>
                        </Tooltip>

                        {/* Customer Live Portal Link */}
                        <Tooltip title="Preview Live Guest Website">
                            <IconButton
                                component={Link}
                                href="/"
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'action.selected',
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <OpenInNewIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                        </Tooltip>

                        {/* Dark / Light Mode Toggle */}
                        <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            <IconButton
                                onClick={toggleColorMode}
                                size="small"
                                sx={{
                                    color: isDark ? '#F59E0B' : 'text.secondary',
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.22)' : 'action.selected',
                                    },
                                }}
                            >
                                {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                        </Tooltip>

                        {/* User Profile Avatar with Menu */}
                        <IconButton onClick={handleProfileMenuOpen} size="small" sx={{ p: 0.3 }}>
                            <MuiBadge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: 'success.main',
                                        color: 'success.main',
                                        boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
                                    },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: isDark ? 'background.paper' : 'grey.900',
                                        color: 'warning.main',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                    }}
                                >
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                </Avatar>
                            </MuiBadge>
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleProfileMenuClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: { width: 240, p: 1, borderRadius: 3 },
                            }}
                        >
                            <Box sx={{ px: 1.5, py: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {user?.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    {user?.email || user?.phone}
                                </Typography>
                                <Chip
                                    label={roleBadge.label}
                                    color={roleBadge.color}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, mt: 0.5 }}
                                />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <MenuItem onClick={() => { handleProfileMenuClose(); toggleColorMode(); }}>
                                <ListItemIcon>
                                    {isDark ? <LightModeIcon fontSize="small" sx={{ color: 'warning.main' }} /> : <DarkModeIcon fontSize="small" />}
                                </ListItemIcon>
                                {isDark ? 'Light Theme' : 'Dark Theme'}
                            </MenuItem>
                            <MenuItem component={Link} href="/" onClick={handleProfileMenuClose}>
                                <ListItemIcon>
                                    <OpenInNewIcon fontSize="small" />
                                </ListItemIcon>
                                Live Guest Website
                            </MenuItem>
                            {!isStandalone && (
                                <MenuItem onClick={() => { handleProfileMenuClose(); handleInstallClick(); }}>
                                    <ListItemIcon>
                                        <InstallMobileIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                    </ListItemIcon>
                                    Install Ops Mobile App
                                </MenuItem>
                            )}
                            <Divider sx={{ my: 1 }} />
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
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            border: 'none',
                            bgcolor: sidebarBg,
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>

                {/* Desktop Permanent Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            borderRight: `1px solid ${sidebarBorder}`,
                            borderTop: 'none',
                            borderBottom: 'none',
                            borderLeft: 'none',
                            bgcolor: sidebarBg,
                        },
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
                    p: { xs: 1.5, sm: 2.5, md: 3 },
                    pb: { xs: 10, sm: 11, md: 4 },
                    width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    maxWidth: '100%',
                    overflowX: 'hidden',
                    mt: '58px',
                    minHeight: 'calc(100vh - 58px)',
                }}
            >
                {/* Global Flash Alerts */}
                {flash?.success && (
                    <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}>
                        {flash.success}
                    </Alert>
                )}
                {flash?.error && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}>
                        {flash.error}
                    </Alert>
                )}

                {children}
            </Box>

            {/* Mobile Staff Quick Dock (Floating Bottom Navigation on Phones) */}
            <Paper
                elevation={6}
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: (theme) => theme.zIndex.appBar,
                    display: { xs: 'block', md: 'none' },
                    borderTop: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)',
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(16px)',
                    pb: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <BottomNavigation
                    showLabels
                    value={
                        url.startsWith('/admin/dashboard') ? 0 :
                        url.startsWith('/admin/check-in') ? 1 :
                        url.startsWith('/admin/bookings') ? 2 :
                        url.startsWith('/admin/dispatch') ? 3 : -1
                    }
                    sx={{
                        bgcolor: 'transparent',
                        height: 60,
                        '& .MuiBottomNavigationAction-root': {
                            minWidth: 'auto',
                            py: 0.5,
                            color: isDark ? '#94A3B8' : '#64748B',
                            '&.Mui-selected': {
                                color: 'warning.main',
                                fontWeight: 700,
                            },
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                '&.Mui-selected': {
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                },
                            },
                        },
                    }}
                >
                    <BottomNavigationAction
                        label="Dashboard"
                        icon={<DashboardIcon sx={{ fontSize: 20 }} />}
                        component={Link}
                        href="/admin/dashboard"
                    />
                    <BottomNavigationAction
                        label="Scan Pass"
                        icon={<QrCodeScannerIcon sx={{ fontSize: 20 }} />}
                        component={Link}
                        href="/admin/check-in"
                    />
                    <BottomNavigationAction
                        label="Bookings"
                        icon={
                            <MuiBadge
                                badgeContent={sidebar_counts?.bikes?.total || 0}
                                color="warning"
                                max={99}
                                sx={{ '& .MuiBadge-badge': { fontSize: '0.62rem', height: 16, minWidth: 16 } }}
                            >
                                <ReceiptLongIcon sx={{ fontSize: 20 }} />
                            </MuiBadge>
                        }
                        component={Link}
                        href="/admin/bookings"
                    />
                    <BottomNavigationAction
                        label="Dispatch"
                        icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
                        component={Link}
                        href="/admin/dispatch"
                    />
                    <BottomNavigationAction
                        label="Menu"
                        icon={<MenuIcon sx={{ fontSize: 20 }} />}
                        onClick={handleDrawerToggle}
                    />
                </BottomNavigation>
            </Paper>

            {/* Quick Command Palette Dialog (⌘K) */}
            <Dialog
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                        border: `1px solid ${sidebarBorder}`,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    },
                }}
            >
                <DialogContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, borderBottom: `1px solid ${sidebarBorder}` }}>
                        <SearchIcon sx={{ color: 'warning.main' }} />
                        <InputBase
                            placeholder="Type to search sections, bookings, services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                            fullWidth
                            sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'text.primary' }}
                        />
                        <IconButton size="small" onClick={() => setSearchOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Typography variant="caption" sx={{ px: 1, py: 1, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                        Navigation Shortcuts
                    </Typography>

                    <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
                        {commandLinks.map((link) => (
                            <ListItemButton
                                key={link.path}
                                component={Link}
                                href={link.path}
                                onClick={() => setSearchOpen(false)}
                                sx={{
                                    borderRadius: 2,
                                    py: 1,
                                    px: 1.5,
                                    mb: 0.5,
                                    gap: 1.5,
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                    },
                                }}
                            >
                                <Box sx={{ color: 'warning.main' }}>{link.icon}</Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{link.label}</Typography>
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            {/* Mobile / iOS App Install Instructions Modal */}
            <Dialog
                open={showIosInstallModal}
                onClose={() => setShowIosInstallModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InstallMobileIcon color="primary" /> Install WhizWheel Ops App
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Install the Ground Ops Console to your phone's home screen for fast camera pass scanning, offline access, and instant vehicle dispatch.
                    </Typography>
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                1
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Tap the <strong>Share</strong> button <IosShareIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.3 }} /> in your browser toolbar (Safari or Chrome menu).
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                2
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Scroll down and tap <strong>"Add to Home Screen"</strong>.
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                3
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Tap <strong>"Add"</strong>. Launch <strong>WhizWheel Ops</strong> directly anytime!
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button variant="contained" onClick={() => setShowIosInstallModal(false)} sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}>
                        Got it!
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Chip,
    Stack,
    Divider,
    Tabs,
    Tab,
    Collapse,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function Login({ status = null, initialTab = 0 }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    // Current active tab: 0 = Sign In, 1 = Sign Up
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showDemoStaff, setShowDemoStaff] = useState(false);

    // Sync tab if URL changes or initialTab updates
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.pathname === '/signup' || window.location.pathname === '/register') {
                setCurrentTab(1);
            } else if (initialTab === 1) {
                setCurrentTab(1);
            }
        }
    }, [initialTab]);

    // Sign In Form
    const loginForm = useForm({
        login: '',
        password: '',
        remember: false,
    });

    // Sign Up Form
    const registerForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        whatsapp_opt_in: true,
    });

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        loginForm.post('/login');
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        registerForm.post('/register');
    };

    const handleQuickFill = (roleEmail) => {
        loginForm.setData({
            ...loginForm.data,
            login: roleEmail,
            password: 'Password123!',
        });
    };

    return (
        <AppLayout fullWidth>
            <Head>
                <title>{currentTab === 0 ? 'Sign In - G.K. WhizWheel Bike Rental Honnavar' : 'Create Account - G.K. WhizWheel Bike Rental'}</title>
                <meta
                    name="description"
                    content="Sign in or register with G.K. WhizWheel Honnavar to book bikes and scooters, manage reservations, and get instant updates."
                />
            </Head>

            <Box
                sx={{
                    minHeight: 'calc(100vh - 180px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 4, sm: 6, md: 8 },
                    px: { xs: 2, sm: 3 },
                    background: isDark
                        ? 'radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.12) 0%, #0B1120 75%)'
                        : 'radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.08) 0%, #F8FAFC 75%)',
                }}
            >
                {/* Back Link */}
                <Box sx={{ width: '100%', maxWidth: 480, mb: 2.5 }}>
                    <Button
                        component={Link}
                        href="/"
                        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                        size="small"
                        sx={{
                            color: isDark ? '#94A3B8' : '#64748B',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 1.5,
                            py: 0.5,
                            '&:hover': {
                                color: '#F59E0B',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.1)',
                            },
                        }}
                    >
                        Back to Homepage
                    </Button>
                </Box>

                {/* Main Auth Card */}
                <Card
                    elevation={isDark ? 0 : 3}
                    sx={{
                        width: '100%',
                        maxWidth: 480,
                        borderRadius: { xs: 3, sm: 4 },
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(245, 158, 11, 0.15)'
                            : '0 20px 45px -10px rgba(15, 23, 42, 0.12)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Brand Top Header */}
                    <Box
                        sx={{
                            pt: 3.5,
                            pb: 2.5,
                            px: { xs: 3, sm: 4 },
                            textAlign: 'center',
                            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
                            background: isDark
                                ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, transparent 100%)'
                                : 'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, transparent 100%)',
                        }}
                    >
                        {/* Logo */}
                        <Box
                            component={Link}
                            href="/"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                mb: 1.5,
                            }}
                        >
                            <Box
                                component="img"
                                src="/images/logo.png"
                                alt="G.K. WhizWheel Honnavar Logo"
                                sx={{
                                    height: { xs: 52, sm: 60 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))',
                                }}
                            />
                        </Box>

                        {/* Title & Trust Proof */}
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                letterSpacing: '-0.02em',
                                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                            }}
                        >
                            {currentTab === 0 ? 'Welcome Back' : 'Create Free Account'}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: isDark ? '#94A3B8' : '#64748B',
                                mt: 0.5,
                                fontSize: '0.875rem',
                            }}
                        >
                            {currentTab === 0
                                ? 'Sign in to access your bike bookings & reservations'
                                : 'Join Honnavar’s #1 rated bike rental platform'}
                        </Typography>

                        {/* Google Rating Social Proof Pill */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    py: 0.4,
                                    px: 1.5,
                                    borderRadius: 99,
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                }}
                            >
                                <StarIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 700,
                                        color: isDark ? '#FCD34D' : '#B45309',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    5.0 ★ (324+ Google Reviews) • Zero Deposit Option
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Tab Navigation */}
                    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.5 }}>
                        <Tabs
                            value={currentTab}
                            onChange={(e, val) => setCurrentTab(val)}
                            variant="fullWidth"
                            sx={{
                                minHeight: 44,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F1F5F9',
                                p: 0.5,
                                borderRadius: 3,
                                '& .MuiTabs-indicator': {
                                    display: 'none',
                                },
                            }}
                        >
                            <Tab
                                label="Sign In"
                                icon={<PersonIcon sx={{ fontSize: 18 }} />}
                                iconPosition="start"
                                sx={{
                                    minHeight: 38,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    textTransform: 'none',
                                    color: isDark ? '#94A3B8' : '#64748B',
                                    transition: 'all 0.2s ease',
                                    '&.Mui-selected': {
                                        color: '#0F172A',
                                        bgcolor: '#F59E0B',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                    },
                                }}
                            />
                            <Tab
                                label="Create Account"
                                icon={<PersonAddIcon sx={{ fontSize: 18 }} />}
                                iconPosition="start"
                                sx={{
                                    minHeight: 38,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    textTransform: 'none',
                                    color: isDark ? '#94A3B8' : '#64748B',
                                    transition: 'all 0.2s ease',
                                    '&.Mui-selected': {
                                        color: '#0F172A',
                                        bgcolor: '#F59E0B',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                    },
                                }}
                            />
                        </Tabs>
                    </Box>

                    <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: { xs: 2.5, sm: 3 } }}>
                        {/* Status Alert */}
                        {status && (
                            <Alert
                                severity="success"
                                icon={<CheckCircleIcon fontSize="inherit" />}
                                sx={{ mb: 2.5, borderRadius: 2.5 }}
                            >
                                {status}
                            </Alert>
                        )}

                        {/* =========================================================================
                            TAB 0: SIGN IN
                        ========================================================================== */}
                        {currentTab === 0 && (
                            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                                {loginForm.errors.login && (
                                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                                        {loginForm.errors.login}
                                    </Alert>
                                )}

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="login"
                                    label="Email or Mobile Number"
                                    name="login"
                                    autoComplete="username"
                                    autoFocus
                                    value={loginForm.data.login}
                                    onChange={(e) => loginForm.setData('login', e.target.value)}
                                    error={Boolean(loginForm.errors.login)}
                                    placeholder="e.g. 9876543210 or your@email.com"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                    }}
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type={showLoginPassword ? 'text' : 'password'}
                                    id="password"
                                    autoComplete="current-password"
                                    value={loginForm.data.password}
                                    onChange={(e) => loginForm.setData('password', e.target.value)}
                                    error={Boolean(loginForm.errors.password)}
                                    helperText={loginForm.errors.password}
                                    placeholder="••••••••"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlinedIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                    edge="end"
                                                    sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                                >
                                                    {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                    }}
                                />

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mt: 1.5,
                                        mb: 2.5,
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={loginForm.data.remember}
                                                onChange={(e) => loginForm.setData('remember', e.target.checked)}
                                                sx={{
                                                    color: isDark ? '#475569' : '#CBD5E1',
                                                    '&.Mui-checked': { color: '#F59E0B' },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                                Remember me
                                            </Typography>
                                        }
                                    />

                                    <Box
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20G.K.%20WhizWheel,%20I%20need%20help%20with%20my%20account%20login"
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{
                                            color: '#F59E0B',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        <WhatsAppIcon sx={{ fontSize: 16, color: '#22C55E' }} />
                                        Need Help?
                                    </Box>
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loginForm.processing}
                                    startIcon={loginForm.processing ? <CircularProgress size={18} color="inherit" /> : <TwoWheelerIcon />}
                                    sx={{
                                        py: 1.4,
                                        borderRadius: 2.5,
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        textTransform: 'none',
                                        bgcolor: '#F59E0B',
                                        color: '#0F172A',
                                        boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
                                        '&:hover': {
                                            bgcolor: '#D97706',
                                            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
                                        },
                                    }}
                                >
                                    {loginForm.processing ? 'Authenticating...' : 'Sign In to Account'}
                                </Button>

                                {/* Switch to Register Prompt */}
                                <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.875rem' }}>
                                        Don’t have an account yet?{' '}
                                        <Box
                                            component="span"
                                            onClick={() => setCurrentTab(1)}
                                            sx={{
                                                color: '#F59E0B',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                        >
                                            Create one in 30 seconds
                                        </Box>
                                    </Typography>
                                </Box>

                                {/* Staff & Demo Quick-Fill Section */}
                                <Box sx={{ mt: 3, pt: 2, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                                    <Button
                                        onClick={() => setShowDemoStaff(!showDemoStaff)}
                                        size="small"
                                        endIcon={showDemoStaff ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        sx={{
                                            color: isDark ? '#64748B' : '#94A3B8',
                                            textTransform: 'none',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            py: 0.5,
                                        }}
                                    >
                                        Staff & Demo Logins (Click to Autofill)
                                    </Button>

                                    <Collapse in={showDemoStaff}>
                                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                                            <Chip
                                                label="Super Admin"
                                                size="small"
                                                onClick={() => handleQuickFill('admin@gkwhizwheel.com')}
                                                sx={{
                                                    bgcolor: 'rgba(168, 85, 247, 0.15)',
                                                    color: '#C084FC',
                                                    borderColor: '#C084FC',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                                variant="outlined"
                                            />
                                            <Chip
                                                label="Store Manager"
                                                size="small"
                                                onClick={() => handleQuickFill('manager.indiranagar@gkwhizwheel.com')}
                                                sx={{
                                                    bgcolor: 'rgba(59, 130, 246, 0.15)',
                                                    color: '#60A5FA',
                                                    borderColor: '#60A5FA',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                                variant="outlined"
                                            />
                                            <Chip
                                                label="Hub Staff"
                                                size="small"
                                                onClick={() => handleQuickFill('staff.indiranagar@gkwhizwheel.com')}
                                                sx={{
                                                    bgcolor: 'rgba(34, 197, 94, 0.15)',
                                                    color: '#4ADE80',
                                                    borderColor: '#4ADE80',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Collapse>
                                </Box>
                            </Box>
                        )}

                        {/* =========================================================================
                            TAB 1: CREATE ACCOUNT (SIGN UP)
                        ========================================================================== */}
                        {currentTab === 1 && (
                            <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    autoComplete="name"
                                    autoFocus
                                    value={registerForm.data.name}
                                    onChange={(e) => registerForm.setData('name', e.target.value)}
                                    error={Boolean(registerForm.errors.name)}
                                    helperText={registerForm.errors.name}
                                    placeholder="e.g. Ramesh Kumar"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                    }}
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={registerForm.data.email}
                                    onChange={(e) => registerForm.setData('email', e.target.value)}
                                    error={Boolean(registerForm.errors.email)}
                                    helperText={registerForm.errors.email}
                                    placeholder="e.g. ramesh@gmail.com"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                    }}
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="phone"
                                    label="Mobile / WhatsApp Number"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={registerForm.data.phone}
                                    onChange={(e) => registerForm.setData('phone', e.target.value)}
                                    error={Boolean(registerForm.errors.phone)}
                                    helperText={registerForm.errors.phone || 'Used for OTP and quick delivery updates'}
                                    placeholder="e.g. 9876543210"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                    }}
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password (min 6 characters)"
                                    type={showRegisterPassword ? 'text' : 'password'}
                                    id="register-password"
                                    autoComplete="new-password"
                                    value={registerForm.data.password}
                                    onChange={(e) => registerForm.setData('password', e.target.value)}
                                    error={Boolean(registerForm.errors.password)}
                                    helperText={registerForm.errors.password}
                                    placeholder="Create a secure password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlinedIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                    edge="end"
                                                    sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                                >
                                                    {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                    }}
                                />

                                <Box sx={{ mt: 1.5, mb: 2.5 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={registerForm.data.whatsapp_opt_in}
                                                onChange={(e) => registerForm.setData('whatsapp_opt_in', e.target.checked)}
                                                sx={{
                                                    color: '#22C55E',
                                                    '&.Mui-checked': { color: '#22C55E' },
                                                }}
                                            />
                                        }
                                        label={
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <WhatsAppIcon sx={{ fontSize: 16, color: '#22C55E' }} />
                                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.825rem' }}>
                                                    Get booking confirmations & pickup location on WhatsApp
                                                </Typography>
                                            </Stack>
                                        }
                                    />
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={registerForm.processing}
                                    startIcon={registerForm.processing ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
                                    sx={{
                                        py: 1.4,
                                        borderRadius: 2.5,
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        textTransform: 'none',
                                        bgcolor: '#F59E0B',
                                        color: '#0F172A',
                                        boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
                                        '&:hover': {
                                            bgcolor: '#D97706',
                                            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
                                        },
                                    }}
                                >
                                    {registerForm.processing ? 'Creating Account...' : 'Register & Start Booking'}
                                </Button>

                                {/* Switch to Sign In Prompt */}
                                <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.875rem' }}>
                                        Already registered?{' '}
                                        <Box
                                            component="span"
                                            onClick={() => setCurrentTab(0)}
                                            sx={{
                                                color: '#F59E0B',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                        >
                                            Sign in to existing account
                                        </Box>
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Customer Trust Badges */}
                        <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

                        <Stack direction="row" spacing={2} justifyContent="space-around" sx={{ textAlign: 'center' }}>
                            <Box>
                                <SecurityIcon sx={{ fontSize: 20, color: '#F59E0B', mb: 0.5 }} />
                                <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                    Zero Deposit
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.72rem' }}>
                                    Option Available
                                </Typography>
                            </Box>

                            <Box>
                                <TwoWheelerIcon sx={{ fontSize: 20, color: '#3B82F6', mb: 0.5 }} />
                                <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                    Free Helmets
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.72rem' }}>
                                    2 Sanitized Sets
                                </Typography>
                            </Box>

                            <Box>
                                <CheckCircleIcon sx={{ fontSize: 20, color: '#22C55E', mb: 0.5 }} />
                                <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                    Instant Pickup
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.72rem' }}>
                                    Station & Palya Rd
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </AppLayout>
    );
}

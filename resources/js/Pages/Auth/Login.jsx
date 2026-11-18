import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Head, useForm, Link } from '@inertiajs/react';
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
    Stack,
    Divider,
    Tabs,
    Tab,
    Tooltip,
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
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function CustomerLogin({ status = null, initialTab = 0 }) {
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';

    // Current active tab: 0 = Sign In, 1 = Sign Up
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

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

    // Customer Sign In Form
    const loginForm = useForm({
        login: '',
        password: '',
        remember: false,
    });

    // Customer Sign Up Form
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

    // Customer OTP Login State
    const [loginMethod, setLoginMethod] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('method') === 'otp' || params.get('tab') === 'otp') {
                return 'otp';
            }
        }
        return 'password';
    });
    const [otpStep, setOtpStep] = useState('input'); // 'input' | 'verify'
    const [otpChannel, setOtpChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
    const [otpPhoneInput, setOtpPhoneInput] = useState('');
    const [otpEmailInput, setOtpEmailInput] = useState('');
    const [otpRemember, setOtpRemember] = useState(true);
    const [otpValue, setOtpValue] = useState('');
    const [otpData, setOtpData] = useState(null);
    const [otpRequestLoading, setOtpRequestLoading] = useState(false);
    const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
    const [otpError, setOtpError] = useState(null);
    const [otpSuccess, setOtpSuccess] = useState(null);
    const [userNotFound, setUserNotFound] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Resend countdown timer effect
    useEffect(() => {
        let interval = null;
        if (otpStep === 'verify' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [otpStep, resendTimer]);

    const handleRequestOtp = async (e, overrideChannel = null) => {
        if (e) e.preventDefault();
        const activeChannel = overrideChannel || otpChannel;
        const rawInput = activeChannel === 'whatsapp' ? otpPhoneInput : otpEmailInput;
        const fallbackInput = (loginForm.data.login || '').trim();
        const input = (rawInput || fallbackInput).trim();

        if (!input) {
            setOtpError(
                activeChannel === 'whatsapp'
                    ? 'Please enter your 10-digit WhatsApp mobile number.'
                    : 'Please enter your registered email address.'
            );
            return;
        }

        setOtpRequestLoading(true);
        setOtpError(null);
        setUserNotFound(false);

        try {
            const res = await axios.post('/login/otp/request', {
                login: input,
                channel: activeChannel,
            });
            if (res.data?.success) {
                setOtpData(res.data);
                if (overrideChannel) {
                    setOtpChannel(overrideChannel);
                }
                setOtpStep('verify');
                setOtpValue('');
                setResendTimer(30);
            } else {
                setOtpError(res.data?.message || 'Failed to send verification code.');
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.not_found) {
                setUserNotFound(true);
            }
            setOtpError(data?.message || data?.errors?.login?.[0] || 'Failed to send verification code. Please check your details.');
        } finally {
            setOtpRequestLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        if (!otpValue || otpValue.trim().length !== 6) {
            setOtpError('Please enter the 6-digit verification code.');
            return;
        }

        setOtpVerifyLoading(true);
        setOtpError(null);

        try {
            const res = await axios.post('/login/otp/verify', {
                user_id: otpData?.user_id,
                otp: otpValue.trim(),
                remember: otpRemember,
            });

            if (res.data?.success) {
                setOtpSuccess('Verified! Signing in to your account...');
                setTimeout(() => {
                    window.location.href = res.data.redirect_url || '/account';
                }, 400);
            } else {
                setOtpError(res.data?.message || 'Invalid or expired verification code.');
            }
        } catch (err) {
            const data = err.response?.data;
            setOtpError(data?.message || data?.errors?.otp?.[0] || 'Verification failed. Please check the code and try again.');
        } finally {
            setOtpVerifyLoading(false);
        }
    };

    const handleResendOtp = async (targetChannel = null) => {
        if (resendTimer > 0 || otpRequestLoading) return;
        await handleRequestOtp(null, targetChannel || otpChannel);
    };

    const handleSwitchToRegisterWithPhone = () => {
        if (otpChannel === 'whatsapp') {
            const clean = otpPhoneInput.replace(/[^0-9]/g, '');
            if (clean.length >= 10) {
                registerForm.setData('phone', clean.slice(-10));
            }
        } else {
            if (otpEmailInput.includes('@')) {
                registerForm.setData('email', otpEmailInput.trim());
            }
        }
        setCurrentTab(1);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 3, sm: 5 },
                px: { xs: 2, sm: 3 },
                bgcolor: isDark ? '#070D19' : '#F8FAFC',
                backgroundImage: isDark
                    ? 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.16) 0%, rgba(11, 19, 43, 0.95) 55%, #070D19 100%)'
                    : 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.09) 0%, #FFFFFF 65%, #F1F5F9 100%)',
                color: isDark ? '#F8FAFC' : '#0F172A',
                position: 'relative',
            }}
        >
            <Head>
                <title>
                    {currentTab === 0
                        ? 'Customer Sign In - G.K. WhizWheel Bike Rental Honnavar'
                        : 'Customer Sign Up - G.K. WhizWheel Bike Rental Honnavar'}
                </title>
                <meta
                    name="description"
                    content="Customer portal for G.K. WhizWheel Honnavar. Sign in to view bike bookings, KYC verification, trip details, and manage reservations."
                />
            </Head>

            {/* Standalone Top Bar: Back to Home + Theme Switcher (No Site Header) */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 480,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2.5,
                }}
            >
                <Button
                    component={Link}
                    href="/"
                    startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                    size="small"
                    sx={{
                        color: isDark ? '#94A3B8' : '#475569',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        borderRadius: 2.5,
                        px: 1.75,
                        py: 0.6,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.04)',
                        '&:hover': {
                            color: '#F59E0B',
                            borderColor: '#F59E0B',
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                        },
                    }}
                >
                    Back to Homepage
                </Button>

                <Tooltip title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
                    <IconButton
                        onClick={toggleColorMode}
                        size="small"
                        sx={{
                            color: isDark ? '#F59E0B' : '#0F172A',
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.04)',
                            p: 0.8,
                            '&:hover': {
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                            },
                        }}
                    >
                        {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Main Customer Auth Card */}
            <Card
                elevation={isDark ? 0 : 4}
                sx={{
                    width: '100%',
                    maxWidth: 480,
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.88)' : '#FFFFFF',
                    backdropFilter: 'blur(20px)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                    boxShadow: isDark
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(245, 158, 11, 0.2)'
                        : '0 20px 45px -10px rgba(15, 23, 42, 0.12)',
                    overflow: 'hidden',
                }}
            >
                {/* Brand Header */}
                <Box
                    sx={{
                        pt: 3.5,
                        pb: 2.5,
                        px: { xs: 3, sm: 4 },
                        textAlign: 'center',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
                        background: isDark
                            ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, transparent 100%)'
                            : 'linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, transparent 100%)',
                    }}
                >
                    {/* Brand Text */}
                    <Box
                        component={Link}
                        href="/"
                        sx={{
                            display: 'inline-block',
                            textDecoration: 'none',
                            mb: 1,
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'scale(1.02)' },
                        }}
                    >
                        <Typography
                            component="div"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: '1.85rem', sm: '2.2rem' },
                                letterSpacing: '-0.03em',
                                lineHeight: 1.1,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                            }}
                        >
                            GK <Box component="span" sx={{ color: '#F59E0B' }}>WhizWheel</Box>
                        </Typography>
                    </Box>

                    {/* Title & Tagline */}
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 800,
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.35rem', sm: '1.5rem' },
                        }}
                    >
                        {currentTab === 0 ? 'Customer Sign In' : 'Create Customer Account'}
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
                            ? 'Access your bike rentals, KYC verification & road trip bookings'
                            : 'Register to book bikes instantly with zero deposit option'}
                    </Typography>

                    {/* Google Rating Social Proof Badge */}
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

                {/* Tab Switcher: Sign In vs Create Account */}
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

                    {/* Google Single Sign-On Button */}
                    <Button
                        component="a"
                        href="/auth/google"
                        fullWidth
                        variant="outlined"
                        sx={{
                            py: 1.25,
                            borderRadius: 2.5,
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            textTransform: 'none',
                            color: isDark ? '#F8FAFC' : '#1E293B',
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : '#CBD5E1',
                            boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 2px 6px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                            mb: 2.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#F8FAFC',
                                borderColor: '#F59E0B',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
                            },
                        }}
                    >
                        <Box
                            component="svg"
                            sx={{ width: 20, height: 20, flexShrink: 0 }}
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                        </Box>
                        <span>{currentTab === 0 ? 'Continue with Google' : 'Sign up with Google'}</span>
                    </Button>

                    {/* Divider */}
                    <Divider sx={{ mb: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }}>
                        <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600, px: 1, letterSpacing: '0.04em' }}>
                            OR WITH MOBILE / EMAIL
                        </Typography>
                    </Divider>

                    {/* =========================================================================
                        TAB 0: CUSTOMER SIGN IN
                    ========================================================================== */}
                    {currentTab === 0 && (
                        <Box>
                            {/* Sub-Switch: Password Login vs OTP Login */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F1F5F9',
                                    p: 0.5,
                                    borderRadius: 2.5,
                                    mb: 2.5,
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                }}
                            >
                                <Button
                                    fullWidth
                                    size="small"
                                    onClick={() => {
                                        setLoginMethod('password');
                                        setOtpError(null);
                                    }}
                                    startIcon={<LockOutlinedIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        borderRadius: 2,
                                        py: 0.85,
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        textTransform: 'none',
                                        bgcolor: loginMethod === 'password' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                                        color: loginMethod === 'password' ? '#F59E0B' : (isDark ? '#94A3B8' : '#64748B'),
                                        boxShadow: loginMethod === 'password' ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)') : 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    Password Login
                                </Button>
                                <Button
                                    fullWidth
                                    size="small"
                                    onClick={() => {
                                        setLoginMethod('otp');
                                        if (loginForm.data.login) {
                                            if (loginForm.data.login.includes('@')) {
                                                setOtpChannel('email');
                                                setOtpEmailInput(loginForm.data.login);
                                            } else {
                                                setOtpChannel('whatsapp');
                                                setOtpPhoneInput(loginForm.data.login);
                                            }
                                        }
                                        setOtpError(null);
                                    }}
                                    startIcon={<SecurityIcon sx={{ fontSize: 16, color: '#F59E0B' }} />}
                                    sx={{
                                        borderRadius: 2,
                                        py: 0.85,
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        textTransform: 'none',
                                        bgcolor: loginMethod === 'otp' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                                        color: loginMethod === 'otp' ? '#F59E0B' : (isDark ? '#94A3B8' : '#64748B'),
                                        boxShadow: loginMethod === 'otp' ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)') : 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    Instant OTP Login
                                </Button>
                            </Box>

                            {/* ================= METHOD 1: PASSWORD LOGIN ================= */}
                            {loginMethod === 'password' && (
                                <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                                    {loginForm.errors.login && (
                                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                                            {loginForm.errors.login}
                                        </Alert>
                                    )}

                                    <Stack spacing={2.25} sx={{ mt: 1 }}>
                                        <Box>
                                            <Typography
                                                component="label"
                                                htmlFor="login"
                                                sx={{
                                                    display: 'block',
                                                    fontSize: '0.825rem',
                                                    fontWeight: 700,
                                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                                    mb: 0.75,
                                                }}
                                            >
                                                Mobile Number or Email <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                id="login"
                                                name="login"
                                                autoComplete="username"
                                                autoFocus
                                                value={loginForm.data.login}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    loginForm.setData('login', val);
                                                    if (val.includes('@')) {
                                                        setOtpEmailInput(val);
                                                    } else {
                                                        setOtpPhoneInput(val);
                                                    }
                                                }}
                                                error={Boolean(loginForm.errors.login)}
                                                placeholder="e.g. 9876543210 or your@email.com"
                                                helperText="Use the mobile number or email you booked with"
                                                FormHelperTextProps={{
                                                    sx: {
                                                        color: isDark ? '#94A3B8' : '#64748B',
                                                        mt: 0.75,
                                                        mx: 0.5,
                                                        fontSize: '0.75rem',
                                                    },
                                                }}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <PersonIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography
                                                component="label"
                                                htmlFor="password"
                                                sx={{
                                                    display: 'block',
                                                    fontSize: '0.825rem',
                                                    fontWeight: 700,
                                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                                    mb: 0.75,
                                                }}
                                            >
                                                Password <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                name="password"
                                                type={showLoginPassword ? 'text' : 'password'}
                                                id="password"
                                                autoComplete="current-password"
                                                value={loginForm.data.password}
                                                onChange={(e) => loginForm.setData('password', e.target.value)}
                                                error={Boolean(loginForm.errors.password)}
                                                helperText={loginForm.errors.password}
                                                placeholder="••••••••"
                                                FormHelperTextProps={{
                                                    sx: {
                                                        color: isDark ? '#F87171' : '#DC2626',
                                                        mt: 0.75,
                                                        mx: 0.5,
                                                        fontSize: '0.75rem',
                                                    },
                                                }}
                                                slotProps={{
                                                    input: {
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
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </Stack>

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
                                            href="https://wa.me/918660989586?text=Hi%20G.K.%20WhizWheel,%20I%20need%20help%20with%20my%20customer%20account%20login"
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
                                        {loginForm.processing ? 'Signing In...' : 'Sign In to Account'}
                                    </Button>

                                    {/* Switch to Register Prompt */}
                                    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.875rem' }}>
                                            New to G.K. WhizWheel?{' '}
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
                                                Create an account in 30 seconds
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* ================= METHOD 2 (STEP 1): OTP INPUT ================= */}
                            {loginMethod === 'otp' && otpStep === 'input' && (
                                <Box component="form" onSubmit={handleRequestOtp} noValidate>
                                    {otpError && (
                                        <Alert
                                            severity={userNotFound ? 'info' : 'error'}
                                            sx={{ mb: 2.5, borderRadius: 2.5 }}
                                            action={
                                                userNotFound ? (
                                                    <Button
                                                        size="small"
                                                        color="inherit"
                                                        onClick={handleSwitchToRegisterWithPhone}
                                                        sx={{ fontWeight: 700, textTransform: 'none' }}
                                                    >
                                                        Sign Up Now →
                                                    </Button>
                                                ) : null
                                            }
                                        >
                                            {otpError}
                                        </Alert>
                                    )}

                                    {/* Channel Selector: WhatsApp vs Email */}
                                    <Box sx={{ mb: 2.25 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                color: isDark ? '#94A3B8' : '#64748B',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                mb: 1,
                                                textAlign: 'center',
                                            }}
                                        >
                                            Where should we send your login code?
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 1.25,
                                                p: 0.5,
                                                borderRadius: 2.5,
                                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F1F5F9',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                            }}
                                        >
                                            <Button
                                                fullWidth
                                                size="small"
                                                onClick={() => {
                                                    setOtpChannel('whatsapp');
                                                    setOtpError(null);
                                                }}
                                                startIcon={<WhatsAppIcon sx={{ fontSize: 18, color: '#22C55E' }} />}
                                                sx={{
                                                    py: 0.9,
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    textTransform: 'none',
                                                    bgcolor: otpChannel === 'whatsapp' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                                                    color: otpChannel === 'whatsapp' ? (isDark ? '#4ADE80' : '#15803D') : (isDark ? '#94A3B8' : '#64748B'),
                                                    border: otpChannel === 'whatsapp' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid transparent',
                                                    boxShadow: otpChannel === 'whatsapp' ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)') : 'none',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                WhatsApp
                                            </Button>
                                            <Button
                                                fullWidth
                                                size="small"
                                                onClick={() => {
                                                    setOtpChannel('email');
                                                    setOtpError(null);
                                                }}
                                                startIcon={<EmailIcon sx={{ fontSize: 18, color: '#3B82F6' }} />}
                                                sx={{
                                                    py: 0.9,
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    textTransform: 'none',
                                                    bgcolor: otpChannel === 'email' ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                                                    color: otpChannel === 'email' ? (isDark ? '#60A5FA' : '#1D4ED8') : (isDark ? '#94A3B8' : '#64748B'),
                                                    border: otpChannel === 'email' ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                                                    boxShadow: otpChannel === 'email' ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)') : 'none',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                Email
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Stack spacing={2.25} sx={{ mt: 1 }}>
                                        {/* Field 1: WhatsApp Mobile Number */}
                                        {otpChannel === 'whatsapp' && (
                                            <Box>
                                                <Typography
                                                    component="label"
                                                    htmlFor="otp-phone-input"
                                                    sx={{
                                                        display: 'block',
                                                        fontSize: '0.825rem',
                                                        fontWeight: 700,
                                                        color: isDark ? '#E2E8F0' : '#1E293B',
                                                        mb: 0.75,
                                                    }}
                                                >
                                                    WhatsApp Mobile Number <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    id="otp-phone-input"
                                                    name="otp-phone-input"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    autoFocus
                                                    value={otpPhoneInput}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val.includes('@')) {
                                                            setOtpChannel('email');
                                                            setOtpEmailInput(val);
                                                            setOtpPhoneInput('');
                                                        } else {
                                                            setOtpPhoneInput(val);
                                                        }
                                                        setOtpError(null);
                                                        setUserNotFound(false);
                                                    }}
                                                    placeholder="98765 43210"
                                                    helperText="We'll send your 6-digit login code directly to your WhatsApp"
                                                    FormHelperTextProps={{
                                                        sx: {
                                                            color: isDark ? '#94A3B8' : '#64748B',
                                                            mt: 0.75,
                                                            mx: 0.5,
                                                            fontSize: '0.75rem',
                                                        },
                                                    }}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                        <WhatsAppIcon sx={{ color: '#22C55E', fontSize: 18 }} />
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontWeight: 700,
                                                                                color: isDark ? '#CBD5E1' : '#475569',
                                                                                fontSize: '0.85rem',
                                                                            }}
                                                                        >
                                                                            +91
                                                                        </Typography>
                                                                    </Box>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        {/* Field 2: Email Address */}
                                        {otpChannel === 'email' && (
                                            <Box>
                                                <Typography
                                                    component="label"
                                                    htmlFor="otp-email-input"
                                                    sx={{
                                                        display: 'block',
                                                        fontSize: '0.825rem',
                                                        fontWeight: 700,
                                                        color: isDark ? '#E2E8F0' : '#1E293B',
                                                        mb: 0.75,
                                                    }}
                                                >
                                                    Registered Email Address <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    id="otp-email-input"
                                                    name="otp-email-input"
                                                    type="email"
                                                    autoComplete="email"
                                                    autoFocus
                                                    value={otpEmailInput}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setOtpEmailInput(val);
                                                        setOtpError(null);
                                                        setUserNotFound(false);
                                                    }}
                                                    placeholder="yourname@example.com"
                                                    helperText="We'll send your 6-digit login code to your email inbox"
                                                    FormHelperTextProps={{
                                                        sx: {
                                                            color: isDark ? '#94A3B8' : '#64748B',
                                                            mt: 0.75,
                                                            mx: 0.5,
                                                            fontSize: '0.75rem',
                                                        },
                                                    }}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <EmailIcon sx={{ color: '#3B82F6', fontSize: 18 }} />
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Stack>

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
                                                    checked={otpRemember}
                                                    onChange={(e) => setOtpRemember(e.target.checked)}
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
                                            href="https://wa.me/918660989586?text=Hi%20G.K.%20WhizWheel,%20I%20need%20help%20with%20my%20customer%20account%20login"
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
                                        disabled={
                                            otpRequestLoading ||
                                            (otpChannel === 'whatsapp' ? !otpPhoneInput.trim() : !otpEmailInput.trim())
                                        }
                                        startIcon={
                                            otpRequestLoading ? (
                                                <CircularProgress size={18} color="inherit" />
                                            ) : otpChannel === 'whatsapp' ? (
                                                <WhatsAppIcon sx={{ color: '#0F172A' }} />
                                            ) : (
                                                <EmailIcon sx={{ color: '#0F172A' }} />
                                            )
                                        }
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
                                        {otpRequestLoading
                                            ? 'Sending Verification Code...'
                                            : otpChannel === 'whatsapp'
                                            ? 'Send Code to WhatsApp'
                                            : 'Send Code to Email'}
                                    </Button>

                                    {/* Switch to Register Prompt */}
                                    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.875rem' }}>
                                            New to G.K. WhizWheel?{' '}
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
                                                Create an account in 30 seconds
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* ================= METHOD 2 (STEP 2): VERIFY OTP ================= */}
                            {loginMethod === 'otp' && otpStep === 'verify' && (
                                <Box component="form" onSubmit={handleVerifyOtp} noValidate>
                                    {otpError && (
                                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                                            {otpError}
                                        </Alert>
                                    )}

                                    {otpSuccess && (
                                        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                                            {otpSuccess}
                                        </Alert>
                                    )}

                                    {/* Delivery badges: WhatsApp & Email */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            mb: 2.5,
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: isDark ? '#94A3B8' : '#64748B',
                                                fontWeight: 700,
                                                display: 'block',
                                                mb: 1.25,
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            LOGIN CODE SENT TO:
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {otpData?.masked_phone && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.25,
                                                        p: 1,
                                                        px: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor:
                                                            otpChannel === 'whatsapp'
                                                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                                                                : 'transparent',
                                                        border:
                                                            otpChannel === 'whatsapp'
                                                                ? '1px solid rgba(34, 197, 94, 0.4)'
                                                                : '1px solid transparent',
                                                    }}
                                                >
                                                    <WhatsAppIcon sx={{ fontSize: 20, color: '#22C55E' }} />
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#1E293B' }}>
                                                            WhatsApp: <Box component="span" sx={{ color: '#22C55E' }}>{otpData.masked_phone}</Box>
                                                        </Typography>
                                                    </Box>
                                                    {otpChannel === 'whatsapp' && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                bgcolor: '#22C55E',
                                                                color: '#070D19',
                                                                fontWeight: 800,
                                                                px: 0.9,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        >
                                                            PRIMARY
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}

                                            {otpData?.masked_email && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.25,
                                                        p: 1,
                                                        px: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor:
                                                            otpChannel === 'email'
                                                                ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                                                : 'transparent',
                                                        border:
                                                            otpChannel === 'email'
                                                                ? '1px solid rgba(59, 130, 246, 0.4)'
                                                                : '1px solid transparent',
                                                    }}
                                                >
                                                    <EmailIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#1E293B' }}>
                                                            Email: <Box component="span" sx={{ color: '#3B82F6' }}>{otpData.masked_email}</Box>
                                                        </Typography>
                                                    </Box>
                                                    {otpChannel === 'email' && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                bgcolor: '#3B82F6',
                                                                color: '#FFFFFF',
                                                                fontWeight: 800,
                                                                px: 0.9,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        >
                                                            PRIMARY
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* 6-digit OTP Field */}
                                    <Box sx={{ mb: 2.5 }}>
                                        <Typography
                                            component="label"
                                            htmlFor="otp-code-input"
                                            sx={{
                                                display: 'block',
                                                fontSize: '0.825rem',
                                                fontWeight: 700,
                                                color: isDark ? '#E2E8F0' : '#1E293B',
                                                mb: 0.75,
                                            }}
                                        >
                                            Enter 6-Digit Code <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            id="otp-code-input"
                                            name="otp-code-input"
                                            autoFocus
                                            value={otpValue}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                                setOtpValue(val);
                                                setOtpError(null);
                                            }}
                                            placeholder="• • • • • •"
                                            slotProps={{
                                                input: {
                                                    sx: {
                                                        fontSize: '1.4rem',
                                                        fontWeight: 800,
                                                        letterSpacing: '0.35em',
                                                        textAlign: 'center',
                                                        input: { textAlign: 'center' },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={otpVerifyLoading || otpValue.length !== 6}
                                        startIcon={otpVerifyLoading ? <CircularProgress size={18} color="inherit" /> : <TwoWheelerIcon />}
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
                                        {otpVerifyLoading ? 'Verifying...' : 'Verify & Sign In'}
                                    </Button>

                                    {/* Alternative Channel Switcher if not received */}
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        {otpChannel === 'whatsapp' && otpData?.masked_email && (
                                            <Typography
                                                variant="caption"
                                                onClick={() => handleResendOtp('email')}
                                                sx={{
                                                    color: '#3B82F6',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    '&:hover': { textDecoration: 'underline' },
                                                }}
                                            >
                                                <EmailIcon sx={{ fontSize: 14 }} />
                                                Didn't receive on WhatsApp? Send to Email instead
                                            </Typography>
                                        )}
                                        {otpChannel === 'email' && otpData?.masked_phone && (
                                            <Typography
                                                variant="caption"
                                                onClick={() => handleResendOtp('whatsapp')}
                                                sx={{
                                                    color: '#22C55E',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    '&:hover': { textDecoration: 'underline' },
                                                }}
                                            >
                                                <WhatsAppIcon sx={{ fontSize: 14 }} />
                                                Didn't receive on Email? Send to WhatsApp instead
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Resend and Back Actions */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mt: 2,
                                        }}
                                    >
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setOtpStep('input');
                                                setOtpValue('');
                                                setOtpError(null);
                                            }}
                                            startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
                                            sx={{
                                                color: isDark ? '#94A3B8' : '#64748B',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.825rem',
                                            }}
                                        >
                                            Change {otpChannel === 'whatsapp' ? 'Number' : 'Email'}
                                        </Button>

                                        <Button
                                            size="small"
                                            disabled={resendTimer > 0 || otpRequestLoading}
                                            onClick={() => handleResendOtp()}
                                            startIcon={
                                                otpChannel === 'whatsapp' ? (
                                                    <WhatsAppIcon sx={{ fontSize: 14, color: resendTimer > 0 ? '#94A3B8' : '#22C55E' }} />
                                                ) : (
                                                    <EmailIcon sx={{ fontSize: 14, color: resendTimer > 0 ? '#94A3B8' : '#3B82F6' }} />
                                                )
                                            }
                                            sx={{
                                                color: resendTimer > 0 ? (isDark ? '#64748B' : '#94A3B8') : '#F59E0B',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.825rem',
                                            }}
                                        >
                                            {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* =========================================================================
                        TAB 1: CUSTOMER SIGN UP
                    ========================================================================== */}
                    {currentTab === 1 && (
                        <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
                            <Stack spacing={2.25} sx={{ mt: 1 }}>
                                <Box>
                                    <Typography
                                        component="label"
                                        htmlFor="name"
                                        sx={{
                                            display: 'block',
                                            fontSize: '0.825rem',
                                            fontWeight: 700,
                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                            mb: 0.75,
                                        }}
                                    >
                                        Full Name (as per Driving License) <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        id="name"
                                        name="name"
                                        autoComplete="name"
                                        autoFocus
                                        value={registerForm.data.name}
                                        onChange={(e) => registerForm.setData('name', e.target.value)}
                                        error={Boolean(registerForm.errors.name)}
                                        helperText={registerForm.errors.name}
                                        placeholder="e.g. Ramesh Kumar"
                                        FormHelperTextProps={{
                                            sx: {
                                                color: isDark ? '#F87171' : '#DC2626',
                                                mt: 0.75,
                                                mx: 0.5,
                                                fontSize: '0.75rem',
                                            },
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PersonIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography
                                        component="label"
                                        htmlFor="email"
                                        sx={{
                                            display: 'block',
                                            fontSize: '0.825rem',
                                            fontWeight: 700,
                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                            mb: 0.75,
                                        }}
                                    >
                                        Email Address <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={registerForm.data.email}
                                        onChange={(e) => registerForm.setData('email', e.target.value)}
                                        error={Boolean(registerForm.errors.email)}
                                        helperText={registerForm.errors.email}
                                        placeholder="e.g. ramesh@gmail.com"
                                        FormHelperTextProps={{
                                            sx: {
                                                color: isDark ? '#F87171' : '#DC2626',
                                                mt: 0.75,
                                                mx: 0.5,
                                                fontSize: '0.75rem',
                                            },
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography
                                        component="label"
                                        htmlFor="phone"
                                        sx={{
                                            display: 'block',
                                            fontSize: '0.825rem',
                                            fontWeight: 700,
                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                            mb: 0.75,
                                        }}
                                    >
                                        WhatsApp / Mobile Number <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={registerForm.data.phone}
                                        onChange={(e) => registerForm.setData('phone', e.target.value)}
                                        error={Boolean(registerForm.errors.phone)}
                                        helperText={registerForm.errors.phone || 'Used for instant booking confirmation & OTP'}
                                        placeholder="e.g. 9876543210"
                                        FormHelperTextProps={{
                                            sx: {
                                                color: registerForm.errors.phone ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#94A3B8' : '#64748B'),
                                                mt: 0.75,
                                                mx: 0.5,
                                                fontSize: '0.75rem',
                                            },
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PhoneIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography
                                        component="label"
                                        htmlFor="register-password"
                                        sx={{
                                            display: 'block',
                                            fontSize: '0.825rem',
                                            fontWeight: 700,
                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                            mb: 0.75,
                                        }}
                                    >
                                        Password (min 6 characters) <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        type={showRegisterPassword ? 'text' : 'password'}
                                        id="register-password"
                                        autoComplete="new-password"
                                        value={registerForm.data.password}
                                        onChange={(e) => registerForm.setData('password', e.target.value)}
                                        error={Boolean(registerForm.errors.password)}
                                        helperText={registerForm.errors.password}
                                        placeholder="Create a secure password"
                                        FormHelperTextProps={{
                                            sx: {
                                                color: isDark ? '#F87171' : '#DC2626',
                                                mt: 0.75,
                                                mx: 0.5,
                                                fontSize: '0.75rem',
                                            },
                                        }}
                                        slotProps={{
                                            input: {
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
                                            },
                                        }}
                                    />
                                </Box>
                            </Stack>

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
                                                Get booking confirmations & pickup directions on WhatsApp
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
                                    Already have an account?{' '}
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

            {/* Subtle Staff / Fleet Portal Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.75rem' }}>
                    © {new Date().getFullYear()} G.K. WhizWheel • Palya Main Rd, Honnavar, Karnataka 581334 •{' '}
                    <Box
                        component={Link}
                        href="/admin/login"
                        sx={{
                            color: isDark ? '#64748B' : '#94A3B8',
                            textDecoration: 'none',
                            '&:hover': { color: '#F59E0B', textDecoration: 'underline' },
                        }}
                    >
                        Staff Login →
                    </Box>
                </Typography>
            </Box>
        </Box>
    );
}

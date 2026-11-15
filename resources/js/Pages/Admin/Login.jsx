import React, { useState } from 'react';
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
    Tooltip,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ShieldIcon from '@mui/icons-material/Shield';
import LockPersonIcon from '@mui/icons-material/LockPerson';

export default function AdminLogin({ status = null }) {
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, sm: 6 },
                px: { xs: 2.5, sm: 3 },
                bgcolor: isDark ? '#070D19' : '#F8FAFC',
                backgroundImage: isDark
                    ? 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.12) 0%, rgba(11, 19, 43, 0.95) 55%, #070D19 100%)'
                    : 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.08) 0%, #FFFFFF 65%, #F1F5F9 100%)',
                color: isDark ? '#F8FAFC' : '#0F172A',
                position: 'relative',
            }}
        >
            <Head title="Staff & Admin Portal Login - GkWhizWheel Console" />

            {/* Top Bar Navigation */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 440,
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
                        borderRadius: 2,
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

            {/* Admin Login Card */}
            <Card
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 440,
                    borderRadius: 3,
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.92)' : '#FFFFFF',
                    backdropFilter: 'blur(20px)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                    boxShadow: isDark
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(245, 158, 11, 0.15)'
                        : '0 20px 45px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px #E2E8F0',
                    overflow: 'hidden',
                }}
            >
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 1.5,
                                color: '#F59E0B',
                            }}
                        >
                            <LockPersonIcon sx={{ fontSize: 26 }} />
                        </Box>
                        <Box
                            component={Link}
                            href="/"
                            sx={{
                                display: 'block',
                                mb: 0.5,
                                textDecoration: 'none',
                                transition: 'opacity 0.2s',
                                '&:hover': { opacity: 0.9 },
                            }}
                        >
                            <Typography
                                component="div"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: '1.75rem', sm: '2rem' },
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.1,
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                }}
                            >
                                GK <Box component="span" sx={{ color: '#F59E0B' }}>WhizWheel</Box>
                            </Typography>
                        </Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                letterSpacing: '-0.02em',
                                fontSize: '1.05rem',
                                mt: 0.5,
                            }}
                        >
                            Operations & Management Console
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: isDark ? '#94A3B8' : '#64748B',
                                fontSize: '0.82rem',
                                mt: 0.5,
                            }}
                        >
                            Authorized Staff, Store Managers & HQ Administrators
                        </Typography>
                    </Box>

                    {/* Status or Error Notifications */}
                    {status && (
                        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {status}
                        </Alert>
                    )}

                    {errors.login && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {errors.login}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="login"
                            label="Email or Mobile Number"
                            placeholder="Enter your registered email or phone"
                            name="login"
                            autoComplete="username"
                            autoFocus
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                            error={Boolean(errors.login)}
                            slotProps={{
                                inputLabel: { sx: { color: isDark ? '#94A3B8' : '#64748B' } },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#F59E0B',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#F59E0B',
                                        },
                                    },
                                },
                            }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            placeholder="••••••••••••"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={Boolean(errors.password)}
                            helperText={errors.password}
                            slotProps={{
                                inputLabel: { sx: { color: isDark ? '#94A3B8' : '#64748B' } },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                            >
                                                {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#F59E0B',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#F59E0B',
                                        },
                                    },
                                },
                            }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2.5 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        size="small"
                                        sx={{
                                            color: isDark ? '#475569' : '#CBD5E1',
                                            '&.Mui-checked': { color: '#F59E0B' },
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                        Remember workstation
                                    </Typography>
                                }
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={processing}
                            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <ShieldIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                py: 1.4,
                                borderRadius: 2,
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                                '&:hover': {
                                    bgcolor: '#D97706',
                                    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)',
                                },
                            }}
                        >
                            {processing ? 'Authenticating...' : 'Sign In to Console'}
                        </Button>
                    </Box>

                    {/* Security Notice */}
                    <Box
                        sx={{
                            mt: 3.5,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F1F5F9',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                            textAlign: 'center',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 0.5 }}>
                            <ShieldIcon sx={{ fontSize: 15, color: isDark ? '#94A3B8' : '#64748B' }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    color: isDark ? '#94A3B8' : '#475569',
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Secure Operational Environment
                            </Typography>
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                color: isDark ? '#64748B' : '#64748B',
                                fontSize: '0.72rem',
                                lineHeight: 1.4,
                            }}
                        >
                            Access is restricted to authorized personnel. All sign-in attempts, administrative actions, and IP addresses are audited for security.
                        </Typography>
                    </Box>

                    {/* Link to Customer Sign In */}
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                            Looking for customer rentals?{' '}
                            <Box
                                component={Link}
                                href="/login"
                                sx={{
                                    color: '#F59E0B',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                Customer Sign In →
                            </Box>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

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
    Chip,
    Stack,
    Divider,
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

    const handleQuickFill = (roleEmail) => {
        setData({
            ...data,
            login: roleEmail,
            password: 'Password123!',
        });
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
            <Head title="Staff & Admin Portal Login - GkWhizWheel Console" />

            {/* Standalone Top Bar */}
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

            {/* Admin Card */}
            <Card
                elevation={isDark ? 0 : 4}
                sx={{
                    width: '100%',
                    maxWidth: 440,
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
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    {/* Brand Logo & Headline */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            component={Link}
                            href="/"
                            sx={{ display: 'inline-flex', mb: 1.5, textDecoration: 'none' }}
                        >
                            <Box
                                component="img"
                                src="/images/logo.png"
                                alt="G.K. WhizWheel Logo"
                                sx={{
                                    height: { xs: 50, sm: 56 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))',
                                }}
                            />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
                            Staff & HQ Console
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                            Store Manager, Hub Staff & Super Admin Access
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
                            name="login"
                            autoComplete="username"
                            autoFocus
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                            error={Boolean(errors.login)}
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
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={Boolean(errors.password)}
                            helperText={errors.password}
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
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
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

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        sx={{
                                            color: isDark ? '#475569' : '#CBD5E1',
                                            '&.Mui-checked': { color: '#F59E0B' },
                                        }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>Remember workstation</Typography>}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={processing}
                            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <ShieldIcon />}
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
                            {processing ? 'Authenticating...' : 'Sign In to Console'}
                        </Button>
                    </Box>

                    {/* Demo Quick-Fill Credentials */}
                    <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }}>
                        <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                            DEMO CREDENTIALS
                        </Typography>
                    </Divider>

                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={1}>
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

                    {/* Link to Customer Sign In */}
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                            Looking for customer bike rentals?{' '}
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

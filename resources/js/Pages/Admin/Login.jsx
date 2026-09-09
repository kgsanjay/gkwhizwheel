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
import KeyIcon from '@mui/icons-material/Key';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StoreIcon from '@mui/icons-material/Store';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
            password: 'Admin@12345',
        });
    };

    const demoAccounts = [
        {
            role: 'Super Admin',
            email: 'admin@whizwheel.com',
            desc: 'Full console access & system config',
            badgeBg: isDark ? 'rgba(168, 85, 247, 0.2)' : '#EDE9FE',
            badgeColor: isDark ? '#D8B4FE' : '#6B21A8',
            borderColor: isDark ? 'rgba(168, 85, 247, 0.45)' : '#C4B5FD',
            icon: <AdminPanelSettingsIcon sx={{ fontSize: 14 }} />,
        },
        {
            role: 'Store Manager',
            email: 'ops@whizwheel.com',
            desc: 'Fleet, bookings & station ops',
            badgeBg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
            badgeColor: isDark ? '#93C5FD' : '#1E40AF',
            borderColor: isDark ? 'rgba(59, 130, 246, 0.45)' : '#93C5FD',
            icon: <StoreIcon sx={{ fontSize: 14 }} />,
        },
        {
            role: 'Hub Staff',
            email: 'rajesh@whizwheel.com',
            desc: 'Check-in, checkout & bike inspection',
            badgeBg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
            badgeColor: isDark ? '#86EFAC' : '#166534',
            borderColor: isDark ? 'rgba(34, 197, 94, 0.45)' : '#86EFAC',
            icon: <BadgeIcon sx={{ fontSize: 14 }} />,
        },
    ];

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
                    maxWidth: { xs: '100%', sm: 480 },
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
                    maxWidth: { xs: '100%', sm: 480 },
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
                    {/* Brand Text & Headline */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            component={Link}
                            href="/"
                            sx={{
                                display: 'inline-block',
                                mb: 1,
                                textDecoration: 'none',
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
                        <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
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
                            placeholder="admin@whizwheel.com or +919999900001"
                            name="login"
                            autoComplete="username"
                            autoFocus
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                            error={Boolean(errors.login)}
                            InputLabelProps={{ sx: { color: isDark ? '#94A3B8' : '#64748B' } }}
                            slotProps={{
                                inputLabel: { sx: { color: isDark ? '#94A3B8' : '#64748B' } },
                                input: {
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
                                },
                            }}
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
                            InputLabelProps={{ sx: { color: isDark ? '#94A3B8' : '#64748B' } }}
                            slotProps={{
                                inputLabel: { sx: { color: isDark ? '#94A3B8' : '#64748B' } },
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
                                },
                            }}
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
                        <Typography
                            variant="caption"
                            sx={{
                                color: isDark ? '#94A3B8' : '#64748B',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                fontSize: '0.72rem',
                            }}
                        >
                            DEMO CONSOLE ACCOUNTS
                        </Typography>
                    </Divider>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                        {demoAccounts.map((account) => {
                            const isSelected = data.login === account.email;
                            return (
                                <Box
                                    key={account.email}
                                    onClick={() => handleQuickFill(account.email)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.25,
                                        borderRadius: 2.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        bgcolor: isSelected
                                            ? (isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7')
                                            : (isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC'),
                                        border: '1px solid',
                                        borderColor: isSelected
                                            ? '#F59E0B'
                                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'),
                                        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
                                        '&:hover': {
                                            borderColor: '#F59E0B',
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                                            transform: 'translateY(-1px)',
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
                                        <Box
                                            sx={{
                                                px: 1,
                                                py: 0.35,
                                                borderRadius: 1.5,
                                                bgcolor: account.badgeBg,
                                                color: account.badgeColor,
                                                border: `1px solid ${account.borderColor}`,
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {account.icon}
                                            {account.role}
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1, pr: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    color: isDark ? '#F8FAFC' : '#0F172A',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {account.email}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'block',
                                                    fontSize: '0.68rem',
                                                    color: isDark ? '#94A3B8' : '#64748B',
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                {account.desc}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Button
                                        size="small"
                                        variant={isSelected ? 'contained' : 'outlined'}
                                        color={isSelected ? 'warning' : 'inherit'}
                                        startIcon={isSelected ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : null}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickFill(account.email);
                                        }}
                                        sx={{
                                            ml: 1,
                                            flexShrink: 0,
                                            fontSize: '0.7rem',
                                            py: 0.3,
                                            px: 1,
                                            minWidth: 54,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderRadius: 1.5,
                                            ...(isSelected
                                                ? {
                                                    bgcolor: '#F59E0B',
                                                    color: '#000000',
                                                    '&:hover': { bgcolor: '#D97706' },
                                                }
                                                : {
                                                    color: isDark ? '#94A3B8' : '#475569',
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                                                    '&:hover': {
                                                        borderColor: '#F59E0B',
                                                        color: '#F59E0B',
                                                    },
                                                }),
                                        }}
                                    >
                                        {isSelected ? 'Filled' : 'Use'}
                                    </Button>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Shared Password Callout */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
                            borderRadius: 2,
                            px: 1.5,
                            py: 0.85,
                            mt: 1.75,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <KeyIcon sx={{ fontSize: 16, color: '#D97706' }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    color: isDark ? '#FDE68A' : '#92400E',
                                }}
                            >
                                Demo Password:
                            </Typography>
                        </Box>
                        <Typography
                            component="code"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                color: isDark ? '#FBBF24' : '#B45309',
                                bgcolor: isDark ? 'rgba(0, 0, 0, 0.35)' : '#FFFFFF',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FCD34D',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Admin@12345
                        </Typography>
                    </Box>

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

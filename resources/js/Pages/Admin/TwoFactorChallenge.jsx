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
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ShieldIcon from '@mui/icons-material/Shield';
import KeyIcon from '@mui/icons-material/Key';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export default function TwoFactorChallenge({ status = null, userEmail = '' }) {
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';
    const [useRecovery, setUseRecovery] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        recovery_code: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/2fa/challenge');
    };

    const toggleRecovery = () => {
        setUseRecovery(!useRecovery);
        reset();
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
            <Head title="Two-Factor Authentication - GK WhizWheel" />

            <Box
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 460 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2.5,
                }}
            >
                <Button
                    component={Link}
                    href="/admin/login"
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
                        '&:hover': { color: '#F59E0B' },
                    }}
                >
                    Back to Login
                </Button>

                <Tooltip title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
                    <IconButton
                        onClick={toggleColorMode}
                        size="small"
                        sx={{
                            color: isDark ? '#F59E0B' : '#0F172A',
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            p: 0.8,
                        }}
                    >
                        {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Tooltip>
            </Box>

            <Card
                elevation={isDark ? 0 : 4}
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 460 },
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
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                                color: '#F59E0B',
                            }}
                        >
                            {useRecovery ? <KeyIcon sx={{ fontSize: 28 }} /> : <ShieldIcon sx={{ fontSize: 28 }} />}
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
                            {useRecovery ? 'Emergency Recovery Code' : 'Two-Factor Challenge'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                            {useRecovery
                                ? 'Enter one of your 10-character emergency recovery codes.'
                                : `Enter the 6-digit code from your authenticator app for ${userEmail || 'your account'}.`}
                        </Typography>
                    </Box>

                    {status && (
                        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {status}
                        </Alert>
                    )}

                    {errors.code && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {errors.code}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {!useRecovery ? (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="code"
                                label="6-Digit Verification Code"
                                placeholder="123456"
                                name="code"
                                autoComplete="one-time-code"
                                autoFocus
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                error={Boolean(errors.code)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <QrCodeScannerIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                            fontFamily: 'monospace',
                                            fontSize: '1.2rem',
                                            letterSpacing: '0.25em',
                                            textAlign: 'center',
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="recovery_code"
                                label="Recovery Code"
                                placeholder="abcde-12345"
                                name="recovery_code"
                                autoFocus
                                value={data.recovery_code}
                                onChange={(e) => setData('recovery_code', e.target.value)}
                                error={Boolean(errors.code)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <KeyIcon sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                            fontFamily: 'monospace',
                                        },
                                    },
                                }}
                            />
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={processing || (!useRecovery && data.code.length < 6) || (useRecovery && !data.recovery_code)}
                            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <ShieldIcon />}
                            sx={{
                                mt: 2,
                                py: 1.4,
                                borderRadius: 2.5,
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                '&:hover': { bgcolor: '#D97706' },
                            }}
                        >
                            {processing ? 'Verifying...' : 'Authenticate & Continue'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                            <Button
                                type="button"
                                variant="text"
                                onClick={toggleRecovery}
                                sx={{
                                    color: isDark ? '#94A3B8' : '#64748B',
                                    textTransform: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    '&:hover': { color: '#F59E0B' },
                                }}
                            >
                                {useRecovery ? '← Use Authenticator App Code' : 'Lost your authenticator device? Use a Recovery Code'}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

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
    Chip,
    Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ShieldIcon from '@mui/icons-material/Shield';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export default function TwoFactorSetup({ qrCode, secretKey, isRequired = false, isConfirmed = false, userRole = 'staff' }) {
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secretKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/2fa/confirm');
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
            <Head title="Setup Two-Factor Authentication - GK WhizWheel" />

            <Box
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 520 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2.5,
                }}
            >
                <Button
                    component={Link}
                    href="/admin/dashboard"
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
                    Back to Dashboard
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
                    maxWidth: { xs: '100%', sm: 520 },
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
                        <Box sx={{ mb: 1.5 }}>
                            {isRequired ? (
                                <Chip
                                    label="MANDATORY FOR YOUR ROLE"
                                    color="error"
                                    size="small"
                                    sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.05em' }}
                                />
                            ) : (
                                <Chip
                                    label="OPTIONAL BUT RECOMMENDED FOR STAFF"
                                    color="info"
                                    size="small"
                                    sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.05em' }}
                                />
                            )}
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
                            Set Up Two-Factor Authentication
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                            Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy.
                        </Typography>
                    </Box>

                    {errors.code && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {errors.code}
                        </Alert>
                    )}

                    {/* QR Code Presentation */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: '#FFFFFF',
                                borderRadius: 3,
                                border: '2px solid',
                                borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#E2E8F0',
                                display: 'inline-flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: 2,
                            }}
                        >
                            {qrCode ? (
                                <img
                                    src={qrCode}
                                    alt="Two Factor QR Code"
                                    style={{ width: 180, height: 180, display: 'block' }}
                                />
                            ) : (
                                <CircularProgress size={40} />
                            )}
                        </Paper>

                        {/* Secret Key with Copy */}
                        <Box
                            sx={{
                                width: '100%',
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box sx={{ minWidth: 0, mr: 1 }}>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontWeight: 600 }}>
                                    Manual entry key:
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        color: '#F59E0B',
                                        letterSpacing: '0.08em',
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {secretKey}
                                </Typography>
                            </Box>
                            <Tooltip title={copied ? 'Copied!' : 'Copy Key'}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleCopySecret}
                                    startIcon={copied ? <CheckCircleIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        color: copied ? '#10B981' : (isDark ? '#F8FAFC' : '#0F172A'),
                                        borderColor: copied ? '#10B981' : (isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1'),
                                        flexShrink: 0,
                                    }}
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Verification Form */}
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="code"
                            label="Confirm 6-Digit Code"
                            placeholder="Enter code from app"
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

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={processing || data.code.length < 6}
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
                            {processing ? 'Activating 2FA...' : 'Verify & Enable 2FA'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

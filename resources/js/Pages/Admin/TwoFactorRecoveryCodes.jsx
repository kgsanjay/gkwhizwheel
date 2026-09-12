import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useColorMode } from '../../theme/ColorModeContext';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    Tooltip,
    Grid,
    Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyIcon from '@mui/icons-material/Key';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function TwoFactorRecoveryCodes({ recoveryCodes = [] }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';
    const [copied, setCopied] = useState(false);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(recoveryCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
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
            }}
        >
            <Head title="Two-Factor Recovery Codes - GK WhizWheel" />

            <Card
                elevation={isDark ? 0 : 4}
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 540 },
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
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                                color: '#10B981',
                            }}
                        >
                            <KeyIcon sx={{ fontSize: 28 }} />
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
                            Save Your Emergency Recovery Codes
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                            Store these one-time recovery codes in a safe place. If you ever lose your phone or authenticator app, each code can be used once to regain account access.
                        </Typography>
                    </Box>

                    <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                        These codes will only be shown once. Please copy or write them down before leaving this page.
                    </Alert>

                    {/* Recovery Codes Grid */}
                    <Box
                        sx={{
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                            borderRadius: 2.5,
                            p: 2,
                            mb: 3,
                        }}
                    >
                        <Grid container spacing={1.5}>
                            {recoveryCodes.map((code, index) => (
                                <Grid item xs={6} key={index}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.25,
                                            textAlign: 'center',
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
                                            border: '1px solid',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em',
                                                color: isDark ? '#F8FAFC' : '#0F172A',
                                            }}
                                        >
                                            {code}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleCopyAll}
                            startIcon={copied ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : <ContentCopyIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                py: 1.2,
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                color: copied ? '#10B981' : (isDark ? '#F8FAFC' : '#0F172A'),
                                borderColor: copied ? '#10B981' : (isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1'),
                                '&:hover': { borderColor: '#F59E0B' },
                            }}
                        >
                            {copied ? 'All Codes Copied!' : 'Copy All Codes'}
                        </Button>

                        <Button
                            component={Link}
                            href="/admin/dashboard"
                            fullWidth
                            variant="contained"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                py: 1.2,
                                borderRadius: 2.5,
                                fontWeight: 800,
                                textTransform: 'none',
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                '&:hover': { bgcolor: '#D97706' },
                            }}
                        >
                            Go to Dashboard
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

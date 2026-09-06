import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Alert,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Stack,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import apiClient, { setAuthToken } from '../../api/client';

export default function AuthModal({ open, onClose, onSuccess, initialTab = 0 }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Login fields
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regWhatsapp, setRegWhatsapp] = useState(true);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setErrorMsg(null);
        setFieldErrors({});
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setFieldErrors({});

        try {
            const isEmail = loginIdentifier.includes('@');
            const payload = {
                password: loginPassword,
                ...(isEmail ? { email: loginIdentifier } : { phone: loginIdentifier }),
            };

            const response = await apiClient.post('/auth/login', payload);
            const token = response.data?.token;
            const user = response.data?.user;

            if (token) {
                setAuthToken(token);
                // Also trigger storage event for listeners
                window.dispatchEvent(new Event('auth:login'));
            }

            if (onSuccess) {
                onSuccess(user, token);
            }
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'Login failed. Please check your credentials.');
            if (err.errors) {
                setFieldErrors(err.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setFieldErrors({});

        try {
            const payload = {
                name: regName,
                email: regEmail,
                phone: regPhone,
                password: regPassword,
                whatsapp_opt_in: regWhatsapp,
            };

            const response = await apiClient.post('/auth/register', payload);
            const token = response.data?.token;
            const user = response.data?.user;

            if (token) {
                setAuthToken(token);
                window.dispatchEvent(new Event('auth:login'));
            }

            if (onSuccess) {
                onSuccess(user, token);
            }
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'Registration failed. Please check your inputs.');
            if (err.errors) {
                setFieldErrors(err.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1,
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {activeTab === 0 ? 'Log In to Book' : 'Create Customer Account'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                    {activeTab === 0
                        ? 'Sign in to access real-time 15-minute booking hold and instant reservation.'
                        : 'Sign up in seconds to reserve bikes, view live documents, and get WhatsApp reminders.'}
                </Typography>

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<LockOutlinedIcon fontSize="small" />} iconPosition="start" label="Sign In" />
                    <Tab icon={<HowToRegIcon fontSize="small" />} iconPosition="start" label="Sign Up" />
                </Tabs>

                {errorMsg && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMsg}
                    </Alert>
                )}

                {/* Login Form */}
                {activeTab === 0 && (
                    <Box component="form" onSubmit={handleLoginSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label="Email or Phone Number"
                                placeholder="e.g. rahul@example.com or 9876543210"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                required
                                error={Boolean(fieldErrors.email || fieldErrors.phone || fieldErrors.login)}
                                helperText={fieldErrors.email?.[0] || fieldErrors.phone?.[0] || fieldErrors.login?.[0]}
                            />

                            <TextField
                                fullWidth
                                type="password"
                                label="Password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                                error={Boolean(fieldErrors.password)}
                                helperText={fieldErrors.password?.[0]}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ py: 1.3, fontWeight: 700, mt: 1 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In & Continue Booking'}
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* Register Form */}
                {activeTab === 1 && (
                    <Box component="form" onSubmit={handleRegisterSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                placeholder="e.g. Rahul Sharma"
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                required
                                error={Boolean(fieldErrors.name)}
                                helperText={fieldErrors.name?.[0]}
                            />

                            <TextField
                                fullWidth
                                type="email"
                                label="Email Address"
                                placeholder="rahul@example.com"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                required
                                error={Boolean(fieldErrors.email)}
                                helperText={fieldErrors.email?.[0]}
                            />

                            <TextField
                                fullWidth
                                label="10-digit Phone Number"
                                placeholder="9876543210"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                required
                                error={Boolean(fieldErrors.phone)}
                                helperText={fieldErrors.phone?.[0]}
                            />

                            <TextField
                                fullWidth
                                type="password"
                                label="Create Password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                required
                                error={Boolean(fieldErrors.password)}
                                helperText={fieldErrors.password?.[0]}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={regWhatsapp}
                                        onChange={(e) => setRegWhatsapp(e.target.checked)}
                                        color="secondary"
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <WhatsAppIcon sx={{ color: '#25D366', fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                            Receive booking confirmation & pickup reminders on WhatsApp
                                        </Typography>
                                    </Box>
                                }
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ py: 1.3, fontWeight: 700, mt: 1 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account & Continue'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

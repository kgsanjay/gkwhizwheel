import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
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
} from '@mui/material';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function AdminLogin({ status = null }) {
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
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#0B132B',
                backgroundImage: 'radial-gradient(at 50% 0%, rgba(245, 158, 11, 0.15) 0px, transparent 60%)',
                p: 2,
            }}
        >
            <Head title="Staff & Admin Portal Login - GkWhizWheel" />

            <Card
                elevation={12}
                sx={{
                    maxWidth: 440,
                    width: '100%',
                    borderRadius: 4,
                    bgcolor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #1E293B',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
            >
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    {/* Brand Logo & Headline */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                p: 1.2,
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText',
                                borderRadius: 3,
                                mb: 1.5,
                                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                            }}
                        >
                            <ElectricBoltIcon sx={{ fontSize: 32 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                            GkWhizWheel Console
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
                            Staff, Store Manager & HQ Administration
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
                                        <PersonIcon sx={{ color: '#94A3B8' }} />
                                    </InputAdornment>
                                ),
                                sx: { color: '#FFFFFF', bgcolor: '#1E293B', borderRadius: 2 },
                            }}
                            InputLabelProps={{
                                sx: { color: '#94A3B8' },
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
                                        <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: '#94A3B8' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { color: '#FFFFFF', bgcolor: '#1E293B', borderRadius: 2 },
                            }}
                            InputLabelProps={{
                                sx: { color: '#94A3B8' },
                            }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        sx={{
                                            color: '#64748B',
                                            '&.Mui-checked': { color: 'secondary.main' },
                                        }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ color: '#94A3B8' }}>Remember workstation</Typography>}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="secondary"
                            disabled={processing}
                            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
                            sx={{
                                py: 1.4,
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                            }}
                        >
                            {processing ? 'Authenticating...' : 'Sign In to Portal'}
                        </Button>
                    </Box>

                    {/* Quick Dev Switcher */}
                    <Divider sx={{ my: 3, borderColor: '#1E293B' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
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

                    {/* Back to Customer Site */}
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Button
                            component={Link}
                            href="/"
                            size="small"
                            startIcon={<ArrowBackIcon />}
                            sx={{ color: '#94A3B8', textTransform: 'none', '&:hover': { color: '#FFFFFF' } }}
                        >
                            Back to Customer Website
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

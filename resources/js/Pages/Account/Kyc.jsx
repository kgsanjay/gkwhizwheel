import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Paper,
    Stack,
    Divider,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Snackbar,
    Container,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import BadgeIcon from '@mui/icons-material/Badge';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axios from 'axios';
import { useColorMode } from '../../theme/ColorModeContext';

const DOCUMENT_TYPES = [
    {
        key: 'driving_license',
        title: 'Driving License',
        required: true,
        description: 'Mandatory for all two-wheeler rentals. Must show valid authorization for geared or non-geared two-wheelers.',
        icon: <BadgeIcon sx={{ fontSize: 32, color: '#F59E0B' }} />,
        badgeBg: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    {
        key: 'national_id',
        title: 'National ID (Aadhaar / Voter ID)',
        required: false,
        description: 'Government-issued identity proof with matching permanent address for security verification.',
        icon: <ContactEmergencyIcon sx={{ fontSize: 32, color: '#38BDF8' }} />,
        badgeBg: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    {
        key: 'passport',
        title: 'Passport',
        required: false,
        description: 'Applicable for international travelers, tourists, or alternate government photo identification.',
        icon: <FlightTakeoffIcon sx={{ fontSize: 32, color: '#A855F7' }} />,
        badgeBg: 'rgba(168, 85, 247, 0.12)',
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
];

export default function AccountKyc({ documents = [], user = null }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Map existing documents by type
    const docMap = {};
    documents.forEach((doc) => {
        docMap[doc.document_type] = doc;
    });

    const dlDoc = docMap['driving_license'];
    const isDlVerified = dlDoc?.verified;
    const isDlUploaded = Boolean(dlDoc);

    const openUploadModal = (typeKey) => {
        setSelectedDocType(typeKey);
        setSelectedFile(null);
        setUploadError('');
        setUploadModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: max 5MB
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size exceeds 5MB limit. Please upload a smaller file.');
            setSelectedFile(null);
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Invalid format. Only PDF, JPG, and PNG are allowed.');
            setSelectedFile(null);
            return;
        }

        setUploadError('');
        setSelectedFile(file);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile || !selectedDocType) return;

        setIsUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('document_type', selectedDocType);
        formData.append('file', selectedFile);

        try {
            await axios.post('/account/kyc/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSnackbar({
                open: true,
                message: 'Document uploaded successfully! Our team will review it shortly.',
                severity: 'success',
            });
            setUploadModalOpen(false);

            // Reload Inertia props to show the updated doc
            router.reload({ only: ['documents'] });
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.file?.[0] || 'Upload failed. Please try again.';
            setUploadError(msg);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="KYC Verification - GK WhizWheel" />

            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
                {/* Header Banner Section */}
                <Box
                    sx={{
                        mb: 4,
                        p: { xs: 2.5, sm: 4 },
                        borderRadius: { xs: 3, sm: 4 },
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                        backdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2.5,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative accent top line */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, #F59E0B 0%, #38BDF8 50%, #10B981 100%)',
                        }}
                    />

                    <Box sx={{ maxWidth: 680 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Chip
                                size="small"
                                label="Customer Portal"
                                sx={{
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                                    color: '#F59E0B',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    borderRadius: 1.5,
                                }}
                            />
                            <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                                Honnavar Two-Wheeler Rentals
                            </Typography>
                        </Stack>

                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                mb: 1,
                                fontSize: { xs: '1.65rem', sm: '2.1rem' },
                            }}
                        >
                            KYC & Identity Verification
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: isDark ? '#94A3B8' : '#64748B',
                                lineHeight: 1.6,
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                            }}
                        >
                            Complete your digital KYC before pickup for instantaneous vehicle key handover at Palya Main Rd or Honnavar Railway Station.
                        </Typography>

                        {user && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 700 }}>
                                    Rider: {user.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                    {user.email}
                                </Typography>
                                {user.phone && (
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                        +91 {user.phone}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Quick navigation buttons */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                        <Button
                            component={Link}
                            href="/account"
                            variant="outlined"
                            startIcon={<ReceiptLongIcon sx={{ color: '#F59E0B' }} />}
                            sx={{
                                fontWeight: 700,
                                borderRadius: 2.5,
                                py: 1,
                                px: 2,
                                color: isDark ? '#E2E8F0' : '#1E293B',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#F59E0B',
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)',
                                    color: '#F59E0B',
                                },
                            }}
                        >
                            My Bookings
                        </Button>
                        <Button
                            component={Link}
                            href="/services/bikes"
                            variant="contained"
                            startIcon={<TwoWheelerIcon />}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 2.5,
                                py: 1,
                                px: 2.5,
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                '&:hover': {
                                    bgcolor: '#D97706',
                                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
                                },
                            }}
                        >
                            Rent a Bike
                        </Button>
                    </Stack>
                </Box>

                {/* Guest Warning if not logged in */}
                {!user && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            mb: 3.5,
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FCD34D',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LockOutlinedIcon sx={{ color: '#F59E0B', fontSize: 24, flexShrink: 0 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FDE68A' : '#92400E' }}>
                                    Sign in to save and link your KYC documents
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#78350F' }}>
                                    You are currently viewing in guest mode. Sign in to submit and track your document verification status.
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            component={Link}
                            href="/login"
                            variant="contained"
                            size="small"
                            sx={{
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                fontWeight: 800,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2,
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#D97706' },
                            }}
                        >
                            Sign In / Use Demo Account →
                        </Button>
                    </Paper>
                )}

                {/* Overall Status Banner */}
                {isDlVerified ? (
                    <Alert
                        icon={<CheckCircleIcon fontSize="inherit" sx={{ color: '#10B981' }} />}
                        severity="success"
                        sx={{
                            mb: 4,
                            borderRadius: 3,
                            alignItems: 'center',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                            border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
                            color: isDark ? '#6EE7B7' : '#065F46',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            KYC Approved & Ready for Pickup
                        </Typography>
                        <Typography variant="body2">
                            Your driving license has been verified by our Honnavar operations desk. You are authorized for instant vehicle keys handover with zero deposit options.
                        </Typography>
                    </Alert>
                ) : isDlUploaded ? (
                    <Alert
                        icon={<PendingActionsIcon fontSize="inherit" sx={{ color: '#3B82F6' }} />}
                        severity="info"
                        sx={{
                            mb: 4,
                            borderRadius: 3,
                            alignItems: 'center',
                            bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
                            color: isDark ? '#93C5FD' : '#1E40AF',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            KYC Verification in Progress
                        </Typography>
                        <Typography variant="body2">
                            Our compliance team is validating your documents. Reviews are typically completed within 30 minutes during hub hours (open 24/7).
                        </Typography>
                    </Alert>
                ) : (
                    <Alert
                        icon={<WarningAmberIcon fontSize="inherit" sx={{ color: '#F59E0B' }} />}
                        severity="warning"
                        sx={{
                            mb: 4,
                            borderRadius: 3,
                            alignItems: 'center',
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                            color: isDark ? '#FCD34D' : '#92400E',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Driving License Required for Pickup
                        </Typography>
                        <Typography variant="body2">
                            Please upload a valid two-wheeler driving license to ensure instant handover without delay when you arrive at our Honnavar hub.
                        </Typography>
                    </Alert>
                )}

                {/* Document Cards: Responsive 3-column Grid (Fixed with size={{ xs: 12, md: 4 }}) */}
                <Grid container spacing={3}>
                    {DOCUMENT_TYPES.map((type) => {
                        const existingDoc = docMap[type.key];
                        const isVerified = existingDoc?.verified;
                        const isUploaded = Boolean(existingDoc);

                        return (
                            <Grid size={{ xs: 12, md: 4 }} key={type.key}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3.5,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                        backdropFilter: 'blur(16px)',
                                        border: '1px solid',
                                        borderColor: isVerified
                                            ? '#10B981'
                                            : isUploaded
                                            ? '#3B82F6'
                                            : isDark
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : '#E2E8F0',
                                        boxShadow: isDark
                                            ? '0 10px 30px rgba(0,0,0,0.4)'
                                            : '0 4px 20px rgba(15, 23, 42, 0.05)',
                                        transition: 'all 0.25s ease',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: isDark
                                                ? '0 14px 36px rgba(0,0,0,0.6)'
                                                : '0 10px 30px rgba(15, 23, 42, 0.1)',
                                            borderColor: isVerified ? '#10B981' : '#F59E0B',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box
                                                sx={{
                                                    p: 1.25,
                                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : type.badgeBg,
                                                    borderRadius: 2.5,
                                                    border: `1px solid ${type.borderColor}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {type.icon}
                                            </Box>
                                            {isVerified ? (
                                                <Chip
                                                    icon={<VerifiedUserIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                                                    label="Verified & Approved"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                                                        color: isDark ? '#34D399' : '#047857',
                                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                    }}
                                                />
                                            ) : isUploaded ? (
                                                <Chip
                                                    icon={<PendingActionsIcon sx={{ fontSize: '14px !important', color: '#3B82F6 !important' }} />}
                                                    label="Under Verification"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
                                                        color: isDark ? '#93C5FD' : '#1D4ED8',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                    }}
                                                />
                                            ) : (
                                                <Chip
                                                    label={type.required ? 'Mandatory for Pickup' : 'Optional ID'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: type.required
                                                            ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7')
                                                            : (isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9'),
                                                        color: type.required
                                                            ? (isDark ? '#FBBF24' : '#B45309')
                                                            : (isDark ? '#94A3B8' : '#64748B'),
                                                        border: '1px solid',
                                                        borderColor: type.required ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                                                        fontWeight: 700,
                                                        fontSize: '0.72rem',
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75, color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '1.1rem' }}>
                                            {type.title}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 2.5, flexGrow: 1, fontSize: '0.85rem', lineHeight: 1.6 }}>
                                            {type.description}
                                        </Typography>

                                        <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

                                        {isUploaded ? (
                                            <Box sx={{ mb: 2, p: 1.25, borderRadius: 2, bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC', border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0' }}>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontWeight: 600 }}>
                                                    Uploaded: {new Date(existingDoc.created_at).toLocaleDateString()}
                                                </Typography>
                                                {existingDoc.file_url && (
                                                    <Button
                                                        href={existingDoc.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        size="small"
                                                        startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                                        sx={{ mt: 0.5, textTransform: 'none', px: 0, color: '#F59E0B', fontWeight: 700, fontSize: '0.78rem' }}
                                                    >
                                                        Preview Uploaded Document ↗
                                                    </Button>
                                                )}
                                            </Box>
                                        ) : (
                                            <Box sx={{ mb: 2, p: 1.25, borderRadius: 2, bgcolor: isDark ? 'rgba(30, 41, 59, 0.3)' : '#F8FAFC', border: isDark ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px dashed #CBD5E1' }}>
                                                <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontStyle: 'italic', display: 'block' }}>
                                                    No file uploaded yet.
                                                </Typography>
                                            </Box>
                                        )}

                                        <Button
                                            variant={isUploaded ? 'outlined' : 'contained'}
                                            fullWidth
                                            startIcon={<CloudUploadIcon />}
                                            onClick={() => openUploadModal(type.key)}
                                            sx={{
                                                borderRadius: 2.5,
                                                py: 1,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: '0.875rem',
                                                ...(isUploaded
                                                    ? {
                                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#CBD5E1',
                                                          color: isDark ? '#F8FAFC' : '#1E293B',
                                                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                                          '&:hover': {
                                                              borderColor: '#F59E0B',
                                                              color: '#F59E0B',
                                                          },
                                                      }
                                                    : {
                                                          bgcolor: '#F59E0B',
                                                          color: '#0F172A',
                                                          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                                                          '&:hover': {
                                                              bgcolor: '#D97706',
                                                              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)',
                                                          },
                                                      }),
                                            }}
                                        >
                                            {isUploaded ? 'Re-upload Document' : 'Upload Document'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Guidelines Box */}
                <Paper
                    elevation={0}
                    sx={{
                        mt: 4,
                        p: { xs: 2.5, sm: 3.5 },
                        borderRadius: 3.5,
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                        backdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        KYC Upload Guidelines & Hub Policy
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                    <strong>Legible Details:</strong> Ensure that all text, license numbers, and dates of birth are completely sharp and readable.
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                    <strong>Accepted Formats:</strong> PDF, JPG, JPEG, or PNG (maximum 5MB per file).
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                    <strong>Name Matching:</strong> Name on your driving license must match your customer account and payment profile.
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                    <strong>Validity Check:</strong> Expired licenses are not accepted by law during pickup at Honnavar hubs.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            {/* Upload Modal Dialog */}
            <Dialog
                open={uploadModalOpen}
                onClose={() => !isUploading && setUploadModalOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderRadius: 3.5,
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    },
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Upload {DOCUMENT_TYPES.find((d) => d.key === selectedDocType)?.title}
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setUploadModalOpen(false)}
                        disabled={isUploading}
                        size="small"
                        sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', p: 3 }}>
                    {uploadError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {uploadError}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: selectedFile ? '#F59E0B' : isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                            borderRadius: 2.5,
                            p: 3.5,
                            textAlign: 'center',
                            bgcolor: selectedFile
                                ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.06)')
                                : (isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: '#F59E0B',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
                            },
                        }}
                        component="label"
                    >
                        <input
                            type="file"
                            hidden
                            accept=".pdf,image/jpeg,image/png,image/jpg"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: selectedFile ? '#F59E0B' : isDark ? '#64748B' : '#94A3B8', mb: 1.5 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                            {selectedFile ? selectedFile.name : 'Click or drop document here'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mt: 0.5 }}>
                            {selectedFile
                                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                                : 'Supports PDF, JPG, PNG (Max 5MB)'}
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }}>
                    <Button onClick={() => setUploadModalOpen(false)} disabled={isUploading} sx={{ textTransform: 'none', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUploadSubmit}
                        disabled={!selectedFile || isUploading}
                        startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 3,
                            bgcolor: '#F59E0B',
                            color: '#0F172A',
                            '&:hover': { bgcolor: '#D97706' },
                        }}
                    >
                        {isUploading ? 'Uploading...' : 'Confirm Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </AppLayout>
    );
}

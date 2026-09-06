import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
import axios from 'axios';

const DOCUMENT_TYPES = [
    {
        key: 'driving_license',
        title: 'Driving License',
        required: true,
        description: 'Mandatory for all two-wheeler rentals. Must show valid authorization for geared or non-geared two-wheelers.',
        icon: <BadgeIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    },
    {
        key: 'national_id',
        title: 'National ID (Aadhaar / Voter ID)',
        required: false,
        description: 'Government-issued identity proof with matching permanent address.',
        icon: <ContactEmergencyIcon sx={{ fontSize: 36, color: 'info.main' }} />,
    },
    {
        key: 'passport',
        title: 'Passport',
        required: false,
        description: 'Applicable for international travelers or alternate identification.',
        icon: <FlightTakeoffIcon sx={{ fontSize: 36, color: 'secondary.main' }} />,
    },
];

export default function AccountKyc({ documents = [], user = null }) {
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
        if (!selectedFile || !selectedDocType) {
            setUploadError('Please choose a file to upload.');
            return;
        }

        setIsUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('document_type', selectedDocType);
        formData.append('file', selectedFile);

        try {
            await axios.post('/api/v1/customer/kyc-documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSnackbar({
                open: true,
                message: 'Document uploaded successfully! Verification is underway.',
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
            <Head title="KYC Verification - GkWhizWheel" />

            <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                        KYC & Identity Verification
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Ensure smooth checkouts and instantaneous vehicle key handovers by completing your digital KYC.
                    </Typography>
                </Box>

                {/* Overall Status Banner */}
                {isDlVerified ? (
                    <Alert
                        icon={<CheckCircleIcon fontSize="inherit" />}
                        severity="success"
                        sx={{ mb: 4, borderRadius: 2, alignItems: 'center' }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            KYC Approved & Ready
                        </Typography>
                        <Typography variant="body2">
                            Your driving license has been verified. You are authorized for instant digital handovers at all GkWhizWheel hubs.
                        </Typography>
                    </Alert>
                ) : isDlUploaded ? (
                    <Alert
                        icon={<PendingActionsIcon fontSize="inherit" />}
                        severity="info"
                        sx={{ mb: 4, borderRadius: 2, alignItems: 'center' }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            KYC Verification in Progress
                        </Typography>
                        <Typography variant="body2">
                            Our compliance team is validating your documents. Reviews are typically completed within 30 minutes during hub hours.
                        </Typography>
                    </Alert>
                ) : (
                    <Alert
                        icon={<WarningAmberIcon fontSize="inherit" />}
                        severity="warning"
                        sx={{ mb: 4, borderRadius: 2, alignItems: 'center' }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Driving License Required
                        </Typography>
                        <Typography variant="body2">
                            Please upload a valid two-wheeler driving license to ensure vehicle pickup without delay.
                        </Typography>
                    </Alert>
                )}

                {/* Document Cards */}
                <Grid container spacing={3}>
                    {DOCUMENT_TYPES.map((type) => {
                        const existingDoc = docMap[type.key];
                        const isVerified = existingDoc?.verified;
                        const isUploaded = Boolean(existingDoc);

                        return (
                            <Grid item xs={12} md={4} key={type.key}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: isVerified ? 'success.light' : isUploaded ? 'info.light' : 'divider',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                                {type.icon}
                                            </Box>
                                            {isVerified ? (
                                                <Chip
                                                    icon={<VerifiedUserIcon />}
                                                    label="Verified"
                                                    color="success"
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            ) : isUploaded ? (
                                                <Chip
                                                    icon={<PendingActionsIcon />}
                                                    label="Under Review"
                                                    color="info"
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            ) : (
                                                <Chip
                                                    label={type.required ? 'Required' : 'Optional'}
                                                    color={type.required ? 'warning' : 'default'}
                                                    size="small"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>

                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                            {type.title}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flexGrow: 1 }}>
                                            {type.description}
                                        </Typography>

                                        <Divider sx={{ my: 1.5 }} />

                                        {isUploaded ? (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Uploaded on: {new Date(existingDoc.created_at).toLocaleDateString()}
                                                </Typography>
                                                {existingDoc.file_url && (
                                                    <Button
                                                        href={existingDoc.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        size="small"
                                                        startIcon={<OpenInNewIcon />}
                                                        sx={{ mt: 1, textTransform: 'none', px: 0 }}
                                                    >
                                                        View Document
                                                    </Button>
                                                )}
                                            </Box>
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                                    No file uploaded yet.
                                                </Typography>
                                            </Box>
                                        )}

                                        <Button
                                            variant={isUploaded ? 'outlined' : 'contained'}
                                            color="primary"
                                            fullWidth
                                            startIcon={<CloudUploadIcon />}
                                            onClick={() => openUploadModal(type.key)}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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
                <Paper sx={{ mt: 5, p: 3, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        KYC Upload Guidelines
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                • Ensure that all text, license numbers, and dates of birth are completely legible.
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                • Acceptable file types: PDF, JPG, JPEG, or PNG (maximum 5MB).
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                • The name on your driving license must match your profile and payment account.
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                • Expired driving licenses are rejected during vehicle pickup at the hub.
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            {/* Upload Modal Dialog */}
            <Dialog
                open={uploadModalOpen}
                onClose={() => !isUploading && setUploadModalOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Upload {DOCUMENT_TYPES.find((d) => d.key === selectedDocType)?.title}
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setUploadModalOpen(false)}
                        disabled={isUploading}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {uploadError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {uploadError}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: selectedFile ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            bgcolor: selectedFile ? 'primary.50' : 'background.paper',
                            cursor: 'pointer',
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
                        <CloudUploadIcon sx={{ fontSize: 44, color: selectedFile ? 'primary.main' : 'text.disabled', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {selectedFile ? selectedFile.name : 'Click or drop file here'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            {selectedFile
                                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                                : 'Supports PDF, JPG, PNG (Max 5MB)'}
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setUploadModalOpen(false)} disabled={isUploading} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUploadSubmit}
                        disabled={!selectedFile || isUploading}
                        startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
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

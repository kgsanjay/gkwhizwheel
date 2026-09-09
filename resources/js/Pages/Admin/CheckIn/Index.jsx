import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Chip,
    Grid,
    Divider,
    Alert,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stack,
    Paper,
    Tab,
    Tabs,
    useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import PoolIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import StorageIcon from '@mui/icons-material/Storage';
import {
    saveOfflineAction,
    getPendingOfflineActions,
    removeOfflineActions,
} from '../../../utils/offlineQueue';

const SERVICE_THEMES = {
    boating: { label: 'Boating Safari', icon: <DirectionsBoatIcon fontSize="small" />, color: '#0284C7', bg: '#E0F2FE' },
    scuba: { label: 'Scuba Diving', icon: <PoolIcon fontSize="small" />, color: '#0D9488', bg: '#CCFBF1' },
    taxi: { label: 'Taxi & Cab', icon: <LocalTaxiIcon fontSize="small" />, color: '#D97706', bg: '#FEF3C7' },
    homestay: { label: 'Homestay', icon: <HomeWorkIcon fontSize="small" />, color: '#7C3AED', bg: '#EDE9FE' },
    two_wheelers: { label: 'Two-Wheeler Rental', icon: <TwoWheelerIcon fontSize="small" />, color: '#EA580C', bg: '#FFEDD5' },
};

export default function CheckInIndex({ initialCode = '', initialBooking = null, recentLogs = [] }) {
    const muiTheme = useTheme();
    const isDark = muiTheme.palette.mode === 'dark';
    const [tabIndex, setTabIndex] = useState(0); // 0: Camera Scanner, 1: Manual Search
    const [searchInput, setSearchInput] = useState(initialCode);
    const [booking, setBooking] = useState(initialBooking);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Offline Queue state (Mavinkurve Jetty / remote intermittent networks)
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [pendingQueue, setPendingQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [queueModalOpen, setQueueModalOpen] = useState(false);

    // Camera state
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
    const [torchOn, setTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [cameraError, setCameraError] = useState('');

    // Action / Balance collection dialog
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('check_in'); // 'check_in' | 'board' | 'collect_balance' | 'complete'
    const [collectAmount, setCollectAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'card'
    const [groundNotes, setGroundNotes] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Audio feedback on successful scan
    const playScanBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch {
            // Audio context not allowed or unsupported
        }
    };

    // Camera scanner start/stop
    const startCamera = async (facing = facingMode) => {
        setCameraError('');
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            const constraints = {
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);

            // Check torch track capability
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.() || {};
            setHasTorch(Boolean(capabilities.torch));
        } catch (err) {
            console.error('Camera access error:', err);
            setCameraError('Camera access denied or unavailable. Use the manual search box below.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const toggleTorch = async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        try {
            await track.applyConstraints({
                advanced: [{ torch: !torchOn }],
            });
            setTorchOn(!torchOn);
        } catch (err) {
            console.warn('Torch toggle error:', err);
        }
    };

    const toggleFacingMode = () => {
        const next = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(next);
        startCamera(next);
    };

    // Live QR detector loop via BarcodeDetector API if supported
    useEffect(() => {
        let intervalId = null;

        if (tabIndex === 0 && cameraActive && 'BarcodeDetector' in window) {
            const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128'] });

            intervalId = setInterval(async () => {
                if (!videoRef.current || videoRef.current.readyState < 2) return;
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        const rawVal = barcodes[0].rawValue;
                        if (rawVal) {
                            playScanBeep();
                            stopCamera();
                            lookupCode(rawVal);
                        }
                    }
                } catch {
                    // Ignore transient frame detection drops
                }
            }, 300);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [cameraActive, tabIndex]);

    useEffect(() => {
        if (tabIndex === 0 && !booking) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [tabIndex, booking]);

    // Offline Queue Management (IndexedDB)
    const refreshQueue = async () => {
        try {
            const items = await getPendingOfflineActions();
            setPendingQueue(items);
        } catch {
            // IndexedDB fallback
        }
    };

    const syncQueue = async (manual = false) => {
        if (isSyncing) return;
        let items = [];
        try {
            items = await getPendingOfflineActions();
        } catch {
            return;
        }

        if (items.length === 0) {
            if (manual) setSuccessMsg('No offline passes in queue to sync.');
            return;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setErrorMsg('Device is currently offline. Connect to internet to sync queued passes.');
            return;
        }

        setIsSyncing(true);
        setErrorMsg('');

        try {
            const res = await fetch('/admin/check-in/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ items }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (data.synced_ids && data.synced_ids.length > 0) {
                    await removeOfflineActions(data.synced_ids);
                }
                await refreshQueue();
                setSuccessMsg(`✓ ${data.message || `Successfully synced ${data.synced_count} offline passes!`}`);
                playScanBeep();
                router.reload({ only: ['recentLogs'] });
            } else {
                setErrorMsg(data.message || 'Sync encountered errors. Some items remain queued in IndexedDB.');
                await refreshQueue();
            }
        } catch {
            setErrorMsg('Network error while syncing offline queue. Passes remain safely in IndexedDB.');
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        refreshQueue();

        const handleOnline = () => {
            setIsOnline(true);
            setSuccessMsg('Network reconnected! Synchronizing offline jetty queue...');
            syncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setErrorMsg('Operating in Offline Mode (Intermittent Jetty Connectivity). Check-ins will queue locally.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                getPendingOfflineActions().then((items) => {
                    if (items.length > 0 && !isSyncing) {
                        syncQueue();
                    }
                }).catch(() => {});
            }
        }, 20000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    // Lookup handler
    const lookupCode = async (codeToSearch) => {
        const query = (codeToSearch || searchInput).trim();
        if (!query) {
            setErrorMsg('Please enter or scan a booking number or phone.');
            return;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setErrorMsg('Offline: Network unavailable at jetty. Connect to Wi-Fi/4G to look up new passes.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await fetch('/admin/check-in/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ code: query }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setBooking(data.data);
                setCollectAmount(data.data.balance_due || 0);
                playScanBeep();
                setSuccessMsg(data.message || 'Booking pass verified!');
            } else {
                setErrorMsg(data.message || `No booking found matching "${query}".`);
            }
        } catch {
            setErrorMsg('Network error while looking up booking.');
        } finally {
            setLoading(false);
        }
    };

    // Open Action / Balance collection dialog
    const openActionModal = (type) => {
        setActionType(type);
        if (booking) {
            setCollectAmount(booking.balance_due || 0);
        }
        setGroundNotes('');
        setActionDialogOpen(true);
    };

    // Queue action locally in IndexedDB when offline
    const queueOfflineCheckIn = async () => {
        try {
            const amountToCollect = actionType === 'collect_balance' || actionType === 'board' ? Number(collectAmount || 0) : 0;
            const queuedTime = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }) + ' (Mavinkurve Offline)';

            const offlineRecord = {
                client_id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                type: booking.type,
                id: booking.id,
                booking_number: booking.booking_number,
                customer_name: booking.customer_name,
                service_type: booking.service_type || 'service',
                action: actionType,
                amount_collected: amountToCollect,
                payment_method: paymentMethod,
                ground_notes: groundNotes,
                queued_at: queuedTime,
                created_at: Date.now(),
            };

            await saveOfflineAction(offlineRecord);
            await refreshQueue();

            // Optimistically update local booking view for staff
            const updated = { ...booking };
            if (booking.type === 'service') {
                if (amountToCollect > 0) {
                    updated.advance_paid = (Number(updated.advance_paid) || 0) + amountToCollect;
                    updated.balance_due = Math.max(0, (Number(updated.balance_due) || 0) - amountToCollect);
                    updated.payment_status = updated.balance_due <= 0 ? 'paid' : 'partial';
                }
                updated.status = actionType === 'complete' ? 'completed' : 'in_progress';
            } else {
                updated.status = actionType === 'complete' ? 'completed' : 'handed_over';
            }

            setBooking(updated);
            setActionDialogOpen(false);
            playScanBeep();
            setSuccessMsg(`⚡ Queued pass #${booking.booking_number} offline in IndexedDB. Will auto-sync when online.`);
        } catch (queueErr) {
            setErrorMsg('Failed to store check-in to local offline queue: ' + (queueErr.message || 'Unknown error'));
        } finally {
            setSubmittingAction(false);
        }
    };

    // Process check-in / collection
    const handleProcessAction = async () => {
        if (!booking) return;

        setSubmittingAction(true);
        setErrorMsg('');

        // If explicitly offline, queue directly to IndexedDB
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            await queueOfflineCheckIn();
            return;
        }

        try {
            const res = await fetch(`/admin/check-in/${booking.type}/${booking.id}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    action: actionType,
                    amount_collected: actionType === 'collect_balance' || actionType === 'board' ? collectAmount : 0,
                    payment_method: paymentMethod,
                    ground_notes: groundNotes,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setBooking(data.data);
                setActionDialogOpen(false);
                setSuccessMsg(data.message || 'Check-in processed successfully!');
                playScanBeep();
            } else {
                setErrorMsg(data.message || 'Failed to process check-in.');
            }
        } catch {
            // Fall back to offline queue on network drops at remote jetty
            await queueOfflineCheckIn();
        } finally {
            setSubmittingAction(false);
        }
    };

    const resetScan = () => {
        setBooking(null);
        setSearchInput('');
        setErrorMsg('');
        setSuccessMsg('');
        if (tabIndex === 0) {
            startCamera();
        }
    };

    const theme = SERVICE_THEMES[booking?.service_type] || {
        label: 'Travel Service',
        icon: <DirectionsBoatIcon fontSize="small" />,
        color: '#0F766E',
        bg: '#F0FDFA',
    };

    return (
        <AdminLayout>
            <Head title="Ground Pass Scanner & Fast Check-In - GK WhizWheels" />

            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }}>
                {/* Header Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    bgcolor: 'success.main',
                                    color: 'common.white',
                                    p: 0.8,
                                    borderRadius: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                }}
                            >
                                <QrCodeScannerIcon />
                            </Box>
                            <div>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
                                    Ground Pass Scanner & Check-In
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Mavinkurve Jetty • Sharavathi Riverfront • Palya Hub Operations
                                </Typography>
                            </div>
                        </Box>
                    </Box>
                    {booking && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={resetScan}
                            startIcon={<QrCodeScannerIcon />}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                            Scan Next Pass
                        </Button>
                    )}
                </Box>

                {/* Offline Pass Verification Queue Bar */}
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 2.5,
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2.5,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        bgcolor: isOnline
                            ? (pendingQueue.length > 0
                                ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF7ED')
                                : (isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4'))
                            : (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'),
                        borderColor: isOnline
                            ? (pendingQueue.length > 0 ? 'warning.main' : 'success.main')
                            : 'error.main',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Chip
                            icon={isOnline ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
                            label={isOnline ? 'Online • Cloud Active' : 'Offline Mode • Mavinkurve Remote Jetty'}
                            color={isOnline ? (pendingQueue.length > 0 ? 'warning' : 'success') : 'error'}
                            size="small"
                            sx={{ fontWeight: 800 }}
                        />
                        {pendingQueue.length > 0 ? (
                            <Chip
                                icon={<CloudQueueIcon fontSize="small" />}
                                label={`${pendingQueue.length} pass${pendingQueue.length === 1 ? '' : 'es'} queued in IndexedDB`}
                                color="warning"
                                variant="outlined"
                                size="small"
                                onClick={() => setQueueModalOpen(true)}
                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                            />
                        ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                IndexedDB queue empty • Real-time cloud sync active
                            </Typography>
                        )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        {pendingQueue.length > 0 && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => setQueueModalOpen(true)}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                            >
                                View Queue ({pendingQueue.length})
                            </Button>
                        )}
                        <Button
                            size="small"
                            variant="contained"
                            disabled={isSyncing || pendingQueue.length === 0}
                            onClick={() => syncQueue(true)}
                            startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 800,
                                borderRadius: 2,
                                bgcolor: pendingQueue.length > 0 ? 'warning.main' : 'primary.main',
                                '&:hover': {
                                    bgcolor: pendingQueue.length > 0 ? 'warning.dark' : 'primary.dark',
                                },
                            }}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    </Stack>
                </Paper>

                {/* Notifications */}
                {successMsg && (
                    <Alert severity="success" sx={{ mb: 2, fontWeight: 600 }} onClose={() => setSuccessMsg('')}>
                        {successMsg}
                    </Alert>
                )}
                {errorMsg && (
                    <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }} onClose={() => setErrorMsg('')}>
                        {errorMsg}
                    </Alert>
                )}

                {/* Active Booking Card (When Loaded) */}
                {booking ? (
                    <Card
                        sx={{
                            borderRadius: 3,
                            border: `2px solid ${theme.color}`,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            overflow: 'hidden',
                            mb: 3,
                        }}
                    >
                        {/* Top Ribbon */}
                        <Box
                            sx={{
                                bgcolor: theme.color,
                                color: 'common.white',
                                px: 2.5,
                                py: 1.5,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {theme.icon}
                                <Typography sx={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {theme.label} Verified Pass
                                </Typography>
                            </Box>
                            <Chip
                                label={booking.status.replace('_', ' ').toUpperCase()}
                                size="small"
                                sx={{
                                    bgcolor: 'common.white',
                                    color: theme.color,
                                    fontWeight: 800,
                                    fontSize: 11,
                                }}
                            />
                        </Box>

                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Grid container spacing={2.5}>
                                {/* Booking Ref & Title */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace' }}>
                                            #{booking.booking_number}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                navigator.clipboard.writeText(booking.booking_number);
                                                setSuccessMsg('Booking reference copied to clipboard.');
                                            }}
                                        >
                                            <ContentCopyIcon fontSize="inherit" />
                                        </IconButton>
                                    </Box>

                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                                        {booking.title}
                                    </Typography>

                                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                                        <Chip
                                            icon={<CalendarMonthIcon fontSize="small" />}
                                            label={booking.start_datetime}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                        <Chip
                                            icon={<LocationOnIcon fontSize="small" />}
                                            label={booking.pickup_location}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                        {booking.quantity && (
                                            <Chip
                                                icon={<PeopleIcon fontSize="small" />}
                                                label={`${booking.quantity} Guest${booking.quantity > 1 ? 's' : ''}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                        {booking.registration_number && (
                                            <Chip
                                                label={`Plate: ${booking.registration_number}`}
                                                size="small"
                                                sx={{ bgcolor: isDark ? 'rgba(251,191,36,0.2)' : '#FEF3C7', color: isDark ? '#FCD34D' : '#92400E', fontWeight: 800, fontFamily: 'monospace' }}
                                            />
                                        )}
                                    </Stack>

                                    {/* Passenger Contact Actions */}
                                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', mb: 2 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                            Customer Details
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
                                            <div>
                                                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: 15 }}>
                                                    {booking.customer_name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                                    {booking.customer_phone}
                                                </Typography>
                                            </div>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    component="a"
                                                    href={`tel:${booking.customer_phone}`}
                                                    startIcon={<PhoneIcon />}
                                                    sx={{ textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.primary' }}
                                                >
                                                    Call
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`https://wa.me/91${booking.customer_phone?.replace(/\D/g, '')}`}
                                                    startIcon={<WhatsAppIcon />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        bgcolor: '#25D366',
                                                        '&:hover': { bgcolor: '#1EBE5D' },
                                                    }}
                                                >
                                                    WhatsApp
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Paper>

                                    {/* Quick Links */}
                                    <Stack direction="row" spacing={1.5}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            component="a"
                                            href={booking.print_url}
                                            target="_blank"
                                            startIcon={<PrintIcon />}
                                            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.primary' }}
                                        >
                                            Printable Pass
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            component="a"
                                            href={booking.voucher_url}
                                            target="_blank"
                                            startIcon={<DownloadIcon />}
                                            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.primary' }}
                                        >
                                            PDF Voucher
                                        </Button>
                                    </Stack>
                                </Grid>

                                {/* Balance & Ground Actions Card */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2.5,
                                            bgcolor: booking.balance_due > 0
                                                ? (isDark ? 'rgba(251,191,36,0.1)' : '#FFFBEB')
                                                : (isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4'),
                                            border: `1.5px solid ${booking.balance_due > 0
                                                ? (isDark ? 'rgba(251,191,36,0.4)' : '#FDE68A')
                                                : (isDark ? 'rgba(16,185,129,0.4)' : '#BBF7D0')}`,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                {booking.balance_due > 0 ? (
                                                    <WarningAmberIcon sx={{ color: 'warning.main' }} />
                                                ) : (
                                                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                                                )}
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: booking.balance_due > 0
                                                        ? (isDark ? '#FCD34D' : '#92400E')
                                                        : (isDark ? '#34D399' : '#166534'),
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.5,
                                                    }}
                                                >
                                                    {booking.balance_due > 0 ? 'Payment Due On Arrival' : 'Fully Paid & Verified'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ my: 1.5 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Pending Balance
                                                </Typography>
                                                <Typography
                                                    variant="h4"
                                                    sx={{
                                                        fontWeight: 900,
                                                        color: booking.balance_due > 0
                                                        ? (isDark ? '#FCD34D' : '#B45309')
                                                        : (isDark ? '#4ADE80' : '#15803D'),
                                                    }}
                                                >
                                                    ₹{booking.balance_due.toLocaleString('en-IN')}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Total ₹{booking.total_amount.toLocaleString('en-IN')} • Advance ₹{booking.advance_paid.toLocaleString('en-IN')} paid
                                                </Typography>
                                            </Box>

                                            {booking.admin_notes && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                        {booking.admin_notes.split('\n').pop()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </div>

                                        {/* Action Button Set */}
                                        <Box sx={{ mt: 2.5 }}>
                                            {booking.balance_due > 0 ? (
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    size="large"
                                                    onClick={() => openActionModal('collect_balance')}
                                                    startIcon={<CheckCircleIcon />}
                                                    sx={{
                                                        py: 1.5,
                                                        fontWeight: 800,
                                                        bgcolor: 'warning.main',
                                                        '&:hover': { bgcolor: 'warning.dark' },
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        fontSize: 15,
                                                        boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                                                    }}
                                                >
                                                    Collect ₹{booking.balance_due} & Board
                                                </Button>
                                            ) : booking.status !== 'completed' ? (
                                                <Stack spacing={1}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        size="large"
                                                        onClick={() => openActionModal('board')}
                                                        startIcon={<CheckCircleIcon />}
                                                        sx={{
                                                            py: 1.4,
                                                            fontWeight: 800,
                                                            bgcolor: 'success.main',
                                                            '&:hover': { bgcolor: 'success.dark' },
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontSize: 15,
                                                        }}
                                                    >
                                                        Confirm Boarding & Start Trip
                                                    </Button>
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => openActionModal('complete')}
                                                        sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
                                                    >
                                                        Mark Completed
                                                    </Button>
                                                </Stack>
                                            ) : (
                                                <Alert severity="success" sx={{ fontWeight: 700 }}>
                                                    This pass is already marked Completed.
                                                </Alert>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Scanner & Manual Search Tabs (When no booking or searching) */}
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <Tabs
                        value={tabIndex}
                        onChange={(_, val) => setTabIndex(val)}
                        variant="fullWidth"
                        sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 1.5 },
                        }}
                    >
                        <Tab icon={<CameraAltIcon />} iconPosition="start" label="Live Camera QR Scanner" />
                        <Tab icon={<SearchIcon />} iconPosition="start" label="Manual Code / Phone Search" />
                    </Tabs>

                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {tabIndex === 0 ? (
                            /* Live Camera Scanner View */
                            <Box sx={{ textAlign: 'center' }}>
                                {cameraError ? (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        {cameraError}
                                    </Alert>
                                ) : null}

                                <Box
                                    sx={{
                                        position: 'relative',
                                        maxWidth: 420,
                                        mx: 'auto',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        bgcolor: '#0F172A',
                                        aspectRatio: '1/1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    <video
                                        ref={videoRef}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        muted
                                        playsInline
                                    />

                                    {/* Viewfinder Target & Laser Line */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '18%',
                                            bottom: '18%',
                                            left: '18%',
                                            right: '18%',
                                            border: '2px solid rgba(255,255,255,0.7)',
                                            borderRadius: 2,
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                                            pointerEvents: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: '2px',
                                                bgcolor: '#10B981',
                                                boxShadow: '0 0 8px #10B981, 0 0 16px #10B981',
                                                animation: 'scanLaser 2s infinite ease-in-out',
                                                '@keyframes scanLaser': {
                                                    '0%': { transform: 'translateY(-70px)' },
                                                    '50%': { transform: 'translateY(70px)' },
                                                    '100%': { transform: 'translateY(-70px)' },
                                                },
                                            }}
                                        />
                                    </Box>

                                    {/* Camera Control Overlays */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 12,
                                            left: 0,
                                            right: 0,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: 1.5,
                                        }}
                                    >
                                        {hasTorch && (
                                            <IconButton
                                                onClick={toggleTorch}
                                                sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: torchOn ? 'warning.light' : 'common.white' }}
                                            >
                                                {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                                            </IconButton>
                                        )}
                                        <IconButton
                                            onClick={toggleFacingMode}
                                            sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'common.white' }}
                                        >
                                            <FlipCameraIosIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
                                    Point camera at the customer's QR ticket on voucher or phone.
                                </Typography>
                            </Box>
                        ) : null}

                        {/* Search Input Bar (Always accessible) */}
                        <Box sx={{ maxWidth: 500, mx: 'auto', mt: tabIndex === 0 ? 2.5 : 0 }}>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    fullWidth
                                    size="medium"
                                    placeholder="Enter Booking # (GKW-...) or 10-digit Phone"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') lookupCode();
                                    }}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => lookupCode()}
                                    disabled={loading}
                                    sx={{
                                        px: 3,
                                        fontWeight: 800,
                                        bgcolor: 'primary.main',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        textTransform: 'none',
                                    }}
                                >
                                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Lookup'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* Recent Ground Check-ins Log */}
                {recentLogs.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, letterSpacing: 0.5 }}>
                            Today's Ground Activity Log
                        </Typography>
                        <Stack spacing={1}>
                            {recentLogs.map((log) => (
                                <Paper
                                    key={log.id}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                                        <div>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {log.description}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                by {log.staff_name}
                                            </Typography>
                                        </div>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                        {log.created_at}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Check-In / Balance Collection Modal */}
            <Dialog
                open={actionDialogOpen}
                onClose={() => setActionDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                    {actionType === 'collect_balance' ? 'Collect Balance & Board' : 'Confirm Passenger Boarding'}
                </DialogTitle>
                <DialogContent>
                    {booking && (
                        <Box sx={{ my: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                {booking.customer_name} • {booking.title} (#{booking.booking_number})
                            </Typography>

                            {booking.balance_due > 0 && (
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                                        Balance Amount to Collect (₹)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        size="small"
                                        value={collectAmount}
                                        onChange={(e) => setCollectAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                        sx={{ mt: 0.5 }}
                                    />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Outstanding balance is ₹{booking.balance_due}.
                                    </Typography>

                                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.primary', mt: 2, mb: 0.5 }}>
                                        Payment Received Via
                                    </Typography>
                                    <RadioGroup
                                        row
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <FormControlLabel value="cash" control={<Radio size="small" />} label="Cash" />
                                        <FormControlLabel value="upi" control={<Radio size="small" />} label="Ground UPI QR" />
                                        <FormControlLabel value="card" control={<Radio size="small" />} label="POS Card" />
                                    </RadioGroup>
                                </Box>
                            )}

                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.5 }}>
                                Staff / Jetty Notes (Optional)
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="e.g. 4 lifejackets issued, boarded Mavinkurve Shikara #2"
                                value={groundNotes}
                                onChange={(e) => setGroundNotes(e.target.value)}
                                multiline
                                rows={2}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setActionDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleProcessAction}
                        disabled={submittingAction}
                        sx={{
                            fontWeight: 800,
                            bgcolor: 'success.main',
                            '&:hover': { bgcolor: 'success.dark' },
                            textTransform: 'none',
                        }}
                    >
                        {submittingAction ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Check In'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Offline Pass Verification Queue Inspector Dialog */}
            <Dialog
                open={queueModalOpen}
                onClose={() => setQueueModalOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorageIcon color="warning" />
                        <span>Offline Pass Verification Queue</span>
                    </Box>
                    <Chip
                        size="small"
                        color="warning"
                        label={`${pendingQueue.length} queued`}
                        sx={{ fontWeight: 800 }}
                    />
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        These ground passes were verified and queued locally in browser IndexedDB while operating at remote jetties with intermittent connectivity (e.g. Mavinkurve). They will auto-sync when online.
                    </Typography>

                    {pendingQueue.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <CloudDoneIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                All Passes Synchronized!
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                No pending offline check-in records in IndexedDB.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.5}>
                            {pendingQueue.map((item, idx) => (
                                <Paper
                                    key={item.client_id || idx}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                Pass #{item.booking_number}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={item.action === 'collect_balance' ? 'Balance Collected' : (item.action === 'board' ? 'Passenger Boarded' : 'Checked In')}
                                                color="primary"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                            />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            {item.queued_at}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        {item.customer_name} • {item.type === 'service' ? 'Service Pass' : 'Bike Rental'}
                                    </Typography>
                                    {item.amount_collected > 0 && (
                                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, display: 'block', mt: 0.5 }}>
                                            Collected ₹{item.amount_collected} via {item.payment_method?.toUpperCase()}
                                        </Typography>
                                    )}
                                    {item.ground_notes && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', mt: 0.2 }}>
                                            Note: "{item.ground_notes}"
                                        </Typography>
                                    )}
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Button onClick={() => setQueueModalOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Close
                    </Button>
                    {pendingQueue.length > 0 && (
                        <Button
                            variant="contained"
                            color="warning"
                            disabled={isSyncing}
                            onClick={() => {
                                syncQueue(true);
                            }}
                            startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync All Queue Items'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Stack,
    Pagination,
    Tooltip,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export default function LogsIndex({ activeTab = 'notifications', notifications = null, activities = null, filters = {} }) {
    const { flash } = usePage().props;
    const [currentTab, setCurrentTab] = useState(activeTab);
    const [search, setSearch] = useState(filters.search || '');
    const [resendingId, setResendingId] = useState(null);

    const handleTabChange = (event, newTab) => {
        setCurrentTab(newTab);
        router.get('/admin/logs', { tab: newTab }, { preserveState: false, preserveScroll: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/admin/logs', { tab: currentTab, search }, { preserveState: true, preserveScroll: true });
    };

    const handleResend = (id) => {
        if (!confirm('Are you sure you want to re-dispatch this alert to the customer?')) return;
        setResendingId(id);
        router.post(`/admin/logs/notifications/${id}/resend`, {}, {
            preserveScroll: true,
            onFinish: () => setResendingId(null),
        });
    };

    const handlePageChange = (event, page) => {
        const query = { tab: currentTab, page };
        if (search) query.search = search;
        router.get('/admin/logs', query, { preserveState: true, preserveScroll: true });
    };

    const renderChannelChip = (channel) => {
        const ch = (channel || '').toLowerCase();
        if (ch === 'whatsapp') {
            return (
                <Chip
                    icon={<WhatsAppIcon sx={{ fontSize: '15px !important' }} />}
                    label="WhatsApp"
                    size="small"
                    sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
                />
            );
        }
        return (
            <Chip
                icon={<EmailIcon sx={{ fontSize: '15px !important' }} />}
                label="Email"
                size="small"
                sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}
            />
        );
    };

    const renderStatusChip = (status) => {
        const st = (status || '').toLowerCase();
        if (st === 'sent' || st === 'delivered') {
            return (
                <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    label={st === 'delivered' ? 'Delivered' : 'Sent'}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                />
            );
        }
        if (st === 'failed') {
            return (
                <Chip
                    icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />}
                    label="Failed"
                    size="small"
                    color="error"
                    sx={{ fontWeight: 600 }}
                />
            );
        }
        return <Chip label={st || 'Pending'} size="small" variant="outlined" />;
    };

    return (
        <AdminLayout title="System Logs & Audit Trail">
            <Head title="System Logs & Alerts - Admin" />

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
                        System Logs & Alerts Viewer
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Inspect automated WhatsApp & Email delivery logs, customer alerts, and full staff activity audit trails.
                    </Typography>
                </Box>
            </Box>

            {flash?.success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    {flash.success}
                </Alert>
            )}

            {flash?.error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {flash.error}
                </Alert>
            )}

            <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Tabs value={currentTab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 700, minHeight: 48 } }}>
                        <Tab
                            value="notifications"
                            icon={<NotificationsActiveIcon fontSize="small" />}
                            iconPosition="start"
                            label="WhatsApp & Email Alerts"
                        />
                        <Tab
                            value="activity"
                            icon={<HistoryEduIcon fontSize="small" />}
                            iconPosition="start"
                            label="Staff Activity & Pricing Audit"
                        />
                    </Tabs>

                    <Box component="form" onSubmit={handleSearchSubmit} sx={{ pb: 1 }}>
                        <TextField
                            size="small"
                            placeholder={currentTab === 'notifications' ? "Search recipient, booking ref, template..." : "Search action, staff name..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                            sx={{ width: { xs: '100%', sm: 300 } }}
                        />
                    </Box>
                </Box>

                {currentTab === 'notifications' && notifications && (
                    <Box>
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 140 }}>Sent At</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 110 }}>Channel</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 180 }}>Recipient</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 150 }}>Booking Ref</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Template / Message</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 110 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 130, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {notifications.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                                No notification logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        notifications.data.map((log) => {
                                            const bookingRef = log.booking?.booking_reference || log.service_booking?.booking_number || '—';
                                            const recipient = log.user?.phone || log.user?.email || 'Customer';

                                            return (
                                                <TableRow key={log.id} hover>
                                                    <TableCell sx={{ fontSize: '0.85rem' }}>
                                                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderChannelChip(log.channel)}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        {recipient}
                                                        {log.user?.name && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                                {log.user.name}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                        {bookingRef}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {log.template || 'Alert'}
                                                        </Typography>
                                                        {log.error_message && (
                                                            <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>
                                                                Error: {log.error_message}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderStatusChip(log.status)}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right' }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            startIcon={resendingId === log.id ? <CircularProgress size={14} /> : <ReplayIcon sx={{ fontSize: 16 }} />}
                                                            disabled={resendingId !== null}
                                                            onClick={() => handleResend(log.id)}
                                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, py: 0.3 }}
                                                        >
                                                            Resend Alert
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {notifications.last_page > 1 && (
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    count={notifications.last_page}
                                    page={notifications.current_page}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {currentTab === 'activity' && activities && (
                    <Box>
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 160 }}>Timestamp</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 180 }}>User</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 140 }}>Branch / Store</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 200 }}>Action</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Details & Audit Diff</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activities.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                                No activity audit logs recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.data.map((act) => {
                                            const actionColors = {
                                                'site_settings.updated': 'primary',
                                                'system_maintenance.release_holds': 'warning',
                                                'system_maintenance.audit_compliance': 'info',
                                                'system_maintenance.flush_cache': 'secondary',
                                                'pricing.bulk_updated': 'success',
                                                'pricing.bike_price_updated': 'success',
                                                'handover.compliance_override': 'error',
                                            };
                                            const chipColor = actionColors[act.action] || 'default';

                                            return (
                                                <TableRow key={act.id} hover>
                                                    <TableCell sx={{ fontSize: '0.85rem' }}>
                                                        {new Date(act.created_at).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {act.user?.name || 'System / Guest'}
                                                        </Typography>
                                                        {act.user?.role && (
                                                            <Chip label={act.user.role} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, mt: 0.3 }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {act.store?.name || 'All Branches'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={act.action}
                                                            size="small"
                                                            color={chipColor}
                                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ maxHeight: 120, overflowY: 'auto', fontSize: '0.8rem', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                                                            {act.new_values ? (
                                                                <pre style={{ margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                                    {JSON.stringify(act.new_values, null, 2)}
                                                                </pre>
                                                            ) : (
                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                    No additional details
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {activities.last_page > 1 && (
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    count={activities.last_page}
                                    page={activities.current_page}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </AdminLayout>
    );
}
